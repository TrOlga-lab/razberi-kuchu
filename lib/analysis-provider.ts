import type { Analysis } from "./analysis";

// Server-only module: import from route handlers, never from client components.
export interface VisionProvider {
  analyze(image: Uint8Array, mimeType: string): Promise<Analysis>;
}

export function getProvider(): VisionProvider | null {
  const provider = process.env.VISION_PROVIDER;
  if (!provider || provider === "demo") return null;
  // Register adapters here; read their credentials from server environment variables.
  // Unknown configurations must fail instead of silently returning demo data.
  throw new Error("Unsupported vision provider");
}

export function demoAnalysis(): Analysis {
  return {
    mode: "demo",
    message: "ДЕМО: готовые примеры, а не предметы, распознанные на вашем фото. Уверенность не оценивалась.",
    items: [
      { name: "Настольная лампа", action: "keep", reason: "Если пользуетесь ею, выделите постоянное место.", confidence: null },
      { name: "Наушники", action: "sell", reason: "Исправную запасную пару можно продать после проверки.", confidence: null },
      { name: "Книги", action: "donate", reason: "Книги в хорошем состоянии можно передать другим.", confidence: null },
      { name: "Старые провода", action: "recycle", reason: "Уточните условия приёма в пункте переработки электроники.", confidence: null },
    ],
  };
}
