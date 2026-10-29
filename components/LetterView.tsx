"use client";
import { useEffect, useMemo, useRef } from "react";
import type { Audit } from "@/lib/types";

export type Focus = { start: number; end: number; nonce: number } | null;

type Mark = { start: number; end: number; cls: string; title?: string };

export function LetterView({ audit, focus, activeSentences }: { audit: Audit; focus: Focus; activeSentences: number[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const marks = useMemo(() => {
    const m: Mark[] = [];
    for (const d of audit.dates) m.push({ start: d.start, end: d.end, cls: "m-date", title: `Date: ${d.role.replace("_", " ")}` });
    for (const r of audit.relative) m.push({ start: r.start, end: r.end, cls: "m-date", title: "Relative deadline" });
    for (const c of audit.citations)
      m.push({ start: c.start, end: c.end, cls: c.status === "not_found" ? "m-bad" : "m-cite", title: c.note ?? c.status });
    for (const id of activeSentences) {
      const s = audit.sentences[id];
      if (s) m.push({ start: s.start, end: s.end, cls: "m-el" });
    }
    if (focus) m.push({ start: focus.start, end: focus.end, cls: "flash" });
    return m;
  }, [audit, focus, activeSentences]);

  const segments = useMemo(() => {
    const text = audit.docText;
    const cuts = new Set<number>([0, text.length]);
    for (const k of marks) {
      cuts.add(Math.max(0, k.start));
      cuts.add(Math.min(text.length, k.end));
    }
    const pts = [...cuts].sort((a, b) => a - b);
    const out: { s: number; e: number; cls: string[]; title?: string }[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const s = pts[i], e = pts[i + 1];
      if (s === e) continue;
      const on = marks.filter((k) => k.start <= s && k.end >= e);
      out.push({ s, e, cls: on.map((k) => k.cls), title: on.find((k) => k.title)?.title });
    }
    return out;
  }, [audit.docText, marks]);

  // Scroll only the letter panel (not the page) so the highlighted text sits mid-panel.
  const scrollTo = (el: Element | null | undefined) => {
    const box = ref.current;
    if (!box || !(el instanceof HTMLElement)) return;
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    box.scrollTo({ top: Math.max(0, top - box.clientHeight / 2), behavior: "smooth" });
    if (window.innerWidth <= 980) box.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!focus || !ref.current) return;
    scrollTo(ref.current.querySelector(`[data-s="${focus.start}"]`) ?? ref.current.querySelector("mark.flash"));
  }, [focus]);

  useEffect(() => {
    if (!activeSentences.length || !ref.current) return;
    scrollTo(ref.current.querySelector("mark.m-el"));
  }, [activeSentences]);

  return (
    <div className="letter" ref={ref} aria-label="The letter">
      {segments.map((g) =>
        g.cls.length ? (
          <mark key={g.s} data-s={g.s} className={[...new Set(g.cls)].join(" ")} title={g.title}>
            {audit.docText.slice(g.s, g.e)}
          </mark>
        ) : (
          <span key={g.s}>{audit.docText.slice(g.s, g.e)}</span>
        ),
      )}
    </div>
  );
}
