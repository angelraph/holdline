"use client";
import type { AnalyzeInput, Audit, RunStep, StreamEvent } from "./types";

export async function analyze(
  input: AnalyzeInput,
  on: { step: (s: RunStep) => void; status: (m: string) => void },
): Promise<Audit> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok || !res.body) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let audit: Audit | undefined;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      const ev = JSON.parse(line) as StreamEvent;
      if (ev.type === "step") on.step(ev.step);
      else if (ev.type === "status") on.status(ev.message);
      else if (ev.type === "result") audit = ev.audit;
      else if (ev.type === "error") throw new Error(ev.message);
    }
  }
  if (!audit) throw new Error("The check ended without a result. Please try again.");
  return audit;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** All-day calendar event with reminders 3 days and 1 day before. */
export function makeIcs(opts: { iso: string; title: string; description: string }): string {
  const d = opts.iso.replaceAll("-", "");
  const next = new Date(`${opts.iso}T12:00:00`);
  next.setDate(next.getDate() + 1);
  const d2 = `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, "0")}${String(next.getDate()).padStart(2, "0")}`;
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => `\\${m}`);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Holdline//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${d}-${Math.random().toString(36).slice(2)}@holdline`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${d2}`,
    `SUMMARY:${esc(opts.title)}`,
    `DESCRIPTION:${esc(opts.description)}`,
    "BEGIN:VALARM", "TRIGGER:-P3D", "ACTION:DISPLAY", `DESCRIPTION:${esc(opts.title)} in 3 days`, "END:VALARM",
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${esc(opts.title)} tomorrow`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatLong(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function formatShort(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const SPEECH_LANG: Record<string, string> = {
  en: "en-US", es: "es-US", vi: "vi-VN", zh: "zh-CN", ht: "fr-HT", ar: "ar-SA", ko: "ko-KR", ru: "ru-RU", tl: "fil-PH", fr: "fr-FR", pt: "pt-BR", so: "so-SO",
};

export function speak(text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = SPEECH_LANG[lang] ?? "en-US";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
  return true;
}
