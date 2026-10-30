"use client";
import { useEffect, useRef, useState } from "react";

// A replay of guard decisions that happened in Holdline's live eval runs
// (the three examples come from different letters, shown together here).
const LINES: { t: string; cls?: string }[] = [
  { t: "$ holdline check medicaid-notice.pdf", cls: "q" },
  { t: "▸ nemotron-3-nano       label dates            0.8s", cls: "dim" },
  { t: "▸ tavily extract        42 CFR 431.210 · .211 · .230  live", cls: "dim" },
  { t: "▸ nemotron-3-ultra      check against the law  3.2s", cls: "dim" },
  { t: "▸ nemotron-3-super      plain summary          1.5s", cls: "dim" },
  { t: "" },
  { t: "summary  “You have 90 days from today to ask for a hearing.”", cls: "q" },
  { t: "  ✕ blocked: “today” is not in sentence [10]", cls: "bad" },
  { t: "    letter says: “within 90 days of the date of this notice”", cls: "dim" },
  { t: "summary  “We ended your coverage.”", cls: "q" },
  { t: "  ✕ blocked: letter says coverage “will end”", cls: "bad" },
  { t: "label    “November 12, 2026” → respond_by", cls: "q" },
  { t: "  ↻ overruled → keep_by: sentence says “to keep your Medicaid”", cls: "bad" },
  { t: "" },
  { t: "✓ 0 ungrounded statements shipped · 3 blocked", cls: "ok" },
];

export function GuardDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || timer) return;
      timer = setInterval(() => setShown((n) => (n >= LINES.length ? (clearInterval(timer), n) : n + 1)), 260);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearInterval(timer);
    };
  }, []);
  return (
    <div className="term" ref={ref} aria-label="Example of Holdline blocking incorrect AI statements">
      <div className="term-h"><span>●</span> guard log · real examples from live eval runs</div>
      <div className="term-b">
        {LINES.slice(0, shown).map((l, i) => (
          <div key={i} className={`term-line ${l.cls ?? ""}`}>{l.t || " "}</div>
        ))}
        {shown < LINES.length && <div className="dim">▍</div>}
      </div>
    </div>
  );
}
