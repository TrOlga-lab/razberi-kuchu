import { demoAnalysis, getProvider } from "../../../lib/analysis-provider";

export const runtime = "nodejs";
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_BODY = MAX_IMAGE + 64 * 1024;
const fail = (error: string, status: number) => Response.json({ error }, { status });

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    return fail("Отправьте фотографию как multipart/form-data.", 415);
  }
  // Bound the actual stream as Content-Length is optional and untrusted.
  const reader = request.body?.getReader();
  if (!reader) return fail("Фотография не получена.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); return fail("Максимальный размер фотографии — 10 МБ.", 413); }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    const form = await new Response(body, { headers: { "content-type": request.headers.get("content-type")! } }).formData();
    const files = form.getAll("image");
    const file = files[0];
    if (files.length !== 1 || !(file instanceof File) || !file.size) return fail("Выберите одну непустую фотографию.", 400);
    if (file.size > MAX_IMAGE) return fail("Максимальный размер фотографии — 10 МБ.", 413);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const png = [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    if (!(file.type === "image/png" && png || file.type === "image/jpeg" && jpeg || file.type === "image/webp" && webp)) {
      return fail("Поддерживаются только фотографии JPG, PNG и WebP с соответствующим содержимым.", 415);
    }
    try {
      const provider = getProvider();
      const result = provider ? await provider.analyze(bytes, file.type) : demoAnalysis();
      return Response.json(result, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return fail("Сервис анализа недоступен. Попробуйте позже.", 503);
    }
  } catch {
    return fail("Не удалось прочитать загруженный файл.", 400);
  } finally {
    reader.releaseLock();
  }
}
