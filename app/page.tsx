"use client";

import { useEffect, useRef, useState } from "react";
import type { Analysis, Action } from "../lib/analysis";
import Link from "next/link";

const examples = [
  { name: "Настольная лампа", action: "Оставить", reason: "Если она работает и вы ей пользуетесь, выделите ей постоянное место.", color: "green" },
  { name: "Беспроводные наушники", action: "Продать", reason: "Исправную запасную пару можно продать. Проверьте звук и комплектность.", color: "blue" },
  { name: "Книги", action: "Отдать", reason: "Прочитанные книги в хорошем состоянии могут пригодиться другим.", color: "pink" },
  { name: "Старые провода", action: "На переработку", reason: "Ненужные кабели сдайте в пункт приёма электроники. Уточните условия приёма.", color: "amber" },
];
const actions: Record<Action, { label: string; color: string }> = {
  keep: { label: "Оставить", color: "green" }, sell: { label: "Продать", color: "blue" },
  donate: { label: "Отдать", color: "pink" }, recycle: { label: "На переработку", color: "amber" },
  discard: { label: "Выбросить", color: "amber" },
};

export default function Home() {
  const input = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<File | null>(null);
  const pending = useRef<AbortController | null>(null);
  const items = results?.items.map(item => ({ ...item, action: actions[item.action].label, color: actions[item.action].color })) ?? examples;

  useEffect(() => () => pending.current?.abort(), []);

  async function analyze() {
    if (!fileRef.current) return;
    const controller = new AbortController();
    pending.current?.abort();
    pending.current = controller;
    setLoading(true); setError(""); setResults(null);
    try {
      const form = new FormData();
      form.append("image", fileRef.current);
      const response = await fetch("/api/analyze", { method: "POST", body: form, signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось разобрать фотографию.");
      if (!controller.signal.aborted) setResults(data as Analysis);
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Не удалось связаться с сервером.");
    } finally {
      if (pending.current === controller) setLoading(false);
    }
  }

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);

  function select(file?: File) {
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Выберите фотографию в формате JPG, PNG или WebP."); return;
    }
    if (file.size > 10 * 1024 * 1024) { setError("Файл слишком большой. Максимальный размер — 10 МБ."); return; }
    pending.current?.abort(); setLoading(false);
    fileRef.current = file;
    setPhoto({ url: URL.createObjectURL(file), name: file.name });
    setResults(null);
  }

  function remove() {
    pending.current?.abort(); setLoading(false); fileRef.current = null;
    setPhoto(null); setResults(null); setError("");
    if (input.current) input.current.value = "";
  }

  return (
    <div className="shell">
      <header><Link className="brand" href="/"> <span className="brand-mark" aria-hidden="true">↗</span>Разбери кучу<span className="beta">бета</span></Link><span className="header-note">Меньше вещей. Больше воздуха.</span></header>
      <main>
        <section className="intro">
          <span className="eyebrow"><span />Порядок начинается с малого</span>
          <h1>Разбери кучу</h1>
          <p className="subtitle">Больше места для жизни.</p>
          <p className="description">Сфотографируйте вещи, которые давно ждут своего часа.<br className="desktop-break" /> Помощник подскажет, что оставить, продать, отдать или сдать на переработку.</p>
        </section>
        <section className="workspace" aria-label="Разбор фотографии">
          <div className="upload-heading"><h2><span className="step">01</span>Начнём с фотографии</h2><span>Одна куча за раз</span></div>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Выбрать фотографию" onChange={e => { select(e.target.files?.[0]); e.target.value = ""; }} />
          {photo ? <div className="preview">
            {/* Local object URLs are intentionally rendered without image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="Загруженная фотография вещей" onError={() => { remove(); setError("Не удалось прочитать фотографию. Выберите другой файл."); }} />
            <button className="remove" onClick={remove} aria-label="Удалить фотографию" title="Удалить фотографию">×</button>
            <span className="filename">{photo.name}</span>
          </div> : <button type="button" className={`dropzone ${dragging ? "dragging" : ""}`} onClick={() => input.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); select(e.dataTransfer.files[0]); }}>
            <span className="upload-icon" aria-hidden="true">↑</span><strong>Загрузите фото вашей кучи</strong><span>Перетащите сюда или <u>выберите файл</u></span><small>JPG, PNG или WebP · до 10 МБ</small>
          </button>}
          {error && <p className="error" role="alert">{error}</p>}
          <div className="upload-footer"><p><span aria-hidden="true">◈</span> Фото отправляется на сервер для анализа</p><button className="primary" disabled={!photo || loading} onClick={analyze} aria-busy={loading}>{loading ? "Разбираем…" : "Разобрать кучу"} <span aria-hidden="true">↗</span></button></div>
        </section>
        <div className="demo-note"><span>ДЕМО</span><p>Сейчас показываем пример рекомендаций. Анализ фотографии с помощью ИИ появится позже.</p></div>
        {results && <section className="results" aria-live="polite"><div className="results-heading"><div><span className="eyebrow">{results.mode === "demo" ? "ДЕМО · Условный пример" : "Результаты анализа"}</span><h2>У каждой вещи — свой путь</h2></div><button className="text-button" onClick={remove}>Другое фото ↗</button></div><p className="result-note">{results.message}</p><div className="items">{items.map((item, i) => <article key={item.name}><span className="item-number">0{i + 1}</span><span className={`tag ${item.color}`}>{item.action}</span><h3>{item.name}</h3><p>{item.reason}</p>{"confidence" in item && <p>Уверенность: {typeof item.confidence === "number" ? Math.round(item.confidence * 100) + "%" : "не оценивалась"}</p>}</article>)}</div></section>}
        <section className="paths" aria-label="Возможные решения"><span>Не всё нужно выбрасывать</span><div><b>Оставить</b><i>·</i><b>Продать</b><i>·</i><b>Отдать</b><i>·</i><b>Переработать</b></div></section>
      </main>
      <footer><span>Разбери кучу</span><p>Освобождаем место для важного.</p><span>С заботой о доме и планете</span></footer>
    </div>
  );
}
