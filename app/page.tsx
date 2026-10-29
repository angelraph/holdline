"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { analyze, fileToBase64 } from "@/lib/client";
import type { AnalyzeInput, Audit, Mode, RunStep } from "@/lib/types";
import { SAMPLES } from "@/samples";
import { PACKS, STATE_ABBR } from "@/rulepacks";
import { LANGUAGES } from "@/lib/languages";
import { LetterView, type Focus } from "@/components/LetterView";
import {
  CitationsCard, ClockCard, CompletenessCard, GuardCard, HelpCard, Packet, ReadabilityCard, ReplyCard, RunLog, SummaryCard,
} from "@/components/Cards";

type Health = { nebius: boolean; tavily: boolean; models: Record<string, string> | null };
type Phase = "start" | "running" | "done";

const STATES = Object.keys(STATE_ABBR);

function Logo() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--hold)" />
      <path d="M7 20h18" stroke="var(--hold-ink)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M11 20V9M21 20V9" stroke="var(--hold-ink)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="16" cy="20" r="3.2" fill="#f6c453" stroke="var(--hold-ink)" strokeWidth="1.6" />
    </svg>
  );
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("start");
  const [mode, setMode] = useState<Mode>("receive");
  const [health, setHealth] = useState<Health | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [packId, setPackId] = useState("auto");
  const [state, setState] = useState("");
  const [lang, setLang] = useState("en");
  const [redact, setRedact] = useState("");
  const [over, setOver] = useState(false);
  const [steps, setSteps] = useState<RunStep[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [audit, setAudit] = useState<Audit | null>(null);
  const [focus, setFocus] = useState<Focus>(null);
  const [active, setActive] = useState<number[]>([]);
  const lastInput = useRef<AnalyzeInput | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then(setHealth).catch(() => setHealth(null));
  }, []);

  const run = useCallback(async (input: AnalyzeInput) => {
    lastInput.current = input;
    setPhase("running");
    setSteps([]);
    setStatus("Reading the letter…");
    setError("");
    setActive([]);
    setFocus(null);
    try {
      const a = await analyze(input, { step: (s) => setSteps((p) => [...p, s]), status: setStatus });
      setAudit(a);
      setPhase("done");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
      setPhase(audit ? "done" : "start");
    }
  }, [audit]);

  const submit = async () => {
    const names = redact.split(",").map((s) => s.trim()).filter((s) => s.length > 1);
    let t = text;
    for (const n of names) t = t.replace(new RegExp(escapeRe(n), "gi"), "[REDACTED]");
    const input: AnalyzeInput = { packId, state: state || undefined, lang, mode };
    if (file) input.file = { name: file.name, mime: file.type || "application/octet-stream", base64: await fileToBase64(file) };
    else input.text = t;
    run(input);
  };

  const runSample = (id: string) => {
    const s = SAMPLES.find((x) => x.id === id)!;
    setText(s.text);
    setFile(null);
    setState(s.state);
    run({ text: s.text, packId: s.packId, state: s.state, lang, mode });
  };

  const rerun = (patch: Partial<AnalyzeInput>) => {
    if (!lastInput.current) return;
    if (patch.lang) setLang(patch.lang);
    if (patch.state) setState(patch.state);
    if (patch.mode) setMode(patch.mode);
    run({ ...lastInput.current, ...patch });
  };

  const jump = (start: number, end: number) => {
    setActive([]);
    setFocus({ start, end, nonce: Date.now() });
  };
  const show = (ids: number[]) => {
    setFocus(null);
    setActive(ids);
  };

  const live = health?.nebius;

  return (
    <main className="shell">
      <header className="topbar no-print">
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); setPhase("start"); setAudit(null); }}>
          <Logo />
          <span className="brand-name">Holdline</span>
        </a>
        <span className="spacer" />
        <div className="seg" role="group" aria-label="Who is using Holdline">
          <button aria-pressed={mode === "receive"} onClick={() => (phase === "done" ? rerun({ mode: "receive" }) : setMode("receive"))}>I got a letter</button>
          <button aria-pressed={mode === "send"} onClick={() => (phase === "done" ? rerun({ mode: "send" }) : setMode("send"))}>I&apos;m sending one</button>
        </div>
        {health && (
          <span className={`pill ${live ? "live" : "offline"}`} title={live ? Object.values(health.models ?? {}).join(", ") : "Add NEBIUS_API_KEY to run Nemotron"}>
            <span className="dot" />
            {live ? "Live · NVIDIA Nemotron on Nebius" : "Offline mode · no AI key"}
            {health.tavily ? " · Tavily" : ""}
          </span>
        )}
      </header>

      <div className="notice no-print" role="note">
        <span aria-hidden>⚖️</span>
        <span>
          <b>Not legal advice.</b> Holdline shows what your letter says and what the regulation says, word for word. A Parent Center, legal aid office, or advocate can help you decide what to do.
        </span>
      </div>

      {error && <div className="error no-print" role="alert">{error}</div>}

      {phase === "start" && (
        <>
          <section className="hero">
            <h1>{mode === "send" ? "Check your notice before it goes out." : "Got a letter that cuts your services or benefits?"}</h1>
            <p>
              {mode === "send"
                ? "Holdline checks a draft notice against the federal rule for what it must contain, and how hard it is to read — before a family gets it."
                : "Holdline checks it against the law. You get the real deadline to keep what you have, the parts the law requires that are missing, and a reply you can send tonight. Every line is a quote or a blank."}
            </p>
          </section>

          <div className="start">
            <section className="card card-pad">
              <div className="section-title">Your letter</div>
              <div
                className={`drop ${over ? "over" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => fileInput.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) setFile(f);
                }}
              >
                {file ? (
                  <span><strong>{file.name}</strong> · {(file.size / 1024).toFixed(0)} KB · <button className="linkbtn" onClick={(e) => { e.stopPropagation(); setFile(null); }}>remove</button></span>
                ) : (
                  <span><strong>Upload a PDF or a phone photo</strong> of the letter, or paste the text below</span>
                )}
                <input ref={fileInput} type="file" accept="application/pdf,image/*" capture="environment" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              {!file && (
                <textarea className="textarea" placeholder="Paste the full letter here…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Letter text" />
              )}
              <div className="row" style={{ marginTop: 14 }}>
                <label className="field">
                  Type of letter
                  <select value={packId} onChange={(e) => setPackId(e.target.value)}>
                    <option value="auto">Detect automatically</option>
                    {PACKS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <label className="field">
                  Your state
                  <select value={state} onChange={(e) => setState(e.target.value)}>
                    <option value="">Detect from letter</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="field">
                  Explain it in
                  <select value={lang} onChange={(e) => setLang(e.target.value)}>
                    {Object.entries(LANGUAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
              </div>
              {!file && (
                <label className="field" style={{ marginTop: 12 }}>
                  Hide names before checking (optional, comma-separated)
                  <input value={redact} onChange={(e) => setRedact(e.target.value)} placeholder="e.g. Jordan, Maria Lopez" />
                </label>
              )}
              <div className="row" style={{ marginTop: 16, alignItems: "center" }}>
                <button className="btn primary" disabled={!file && text.trim().length < 40} onClick={submit}>
                  {mode === "send" ? "Check this draft" : "Check this letter"}
                </button>
                <span className="src">Nothing is stored. Names you list are replaced on your device before sending.</span>
              </div>
            </section>

            <section className="card card-pad">
              <div className="section-title">Or try a sample letter</div>
              <div className="samples">
                {SAMPLES.map((s) => (
                  <button className="sample" key={s.id} onClick={() => runSample(s.id)}>
                    <b>{s.title}</b>
                    <span>{s.blurb}</span>
                    <span className="tag">{PACKS.find((p) => p.id === s.packId)?.short} · {s.state}</span>
                  </button>
                ))}
              </div>
              <div className="src" style={{ marginTop: 10 }}>Fictional letters. No real child, family, or agency.</div>
            </section>
          </div>

          <div className="how">
            <div><b>1 · The real deadline</b><span>Dates are read from the page by code. “Within 10 days of this notice” becomes a calendar date, with the math shown.</span></div>
            <div><b>2 · What the law requires</b><span>NVIDIA Nemotron checks the letter against the regulation’s own list, pulled live from ecfr.gov. Every finding points to a sentence.</span></div>
            <div><b>3 · A reply and real help</b><span>A reply made of fixed wording, quotes, and blanks — plus your local Parent Center and legal aid, found on trusted sites only.</span></div>
          </div>

          <div className="proof">
            <b>Why this matters.</b> In January 2026 a federal court found that one state’s Medicaid termination notices violated due process, calling them notices that
            <blockquote>“border on the incomprehensible.”</blockquote>
            <div className="src" style={{ marginTop: 6 }}>
              <a href="https://healthlaw.org/resource/chianne-d-et-al-v-jason-weida-middle-district-court-of-florida/" target="_blank" rel="noreferrer">Chianne D. v. Harris (M.D. Fla. 2026)</a> · During the Medicaid unwinding, 69% of people disenrolled lost coverage for paperwork reasons (
              <a href="https://www.kff.org/medicaid/issue-brief/medicaid-enrollment-and-unwinding-tracker/" target="_blank" rel="noreferrer">KFF</a>).
            </div>
          </div>
        </>
      )}

      {phase === "running" && (
        <section className="progress" aria-live="polite">
          <h2>Checking your letter…</h2>
          <div className="sub">{status}</div>
          <ul className="steps">
            {steps.map((s) => (
              <li key={s.id + s.label}>
                <span className={`ic ${s.status}`}>{s.status === "ok" ? "✓" : s.status === "error" ? "!" : "–"}</span>
                <div>
                  <div>{s.label}</div>
                  {s.detail && <div className="det">{s.detail}</div>}
                </div>
                <span className="meta">{s.model ? s.model.split("/").pop() : s.kind}</span>
              </li>
            ))}
            <li>
              <span className="ic spin" />
              <div>{status || "Working…"}</div>
              <span />
            </li>
          </ul>
        </section>
      )}

      {phase === "done" && audit && (
        <>
          <div className="row no-print" style={{ marginBottom: 14, alignItems: "center" }}>
            <button className="btn small" onClick={() => { setPhase("start"); setAudit(null); }}>← New letter</button>
            <span className="pill">{audit.packShort}</span>
            {audit.runMode === "offline" && <span className="pill offline"><span className="dot" />Offline: keyword checks, no AI</span>}
            {audit.runMode === "recorded" && (
              <span className="pill live" title="This demo server has no model key, so it shows a saved live run of this sample.">
                <span className="dot" />Recorded live run · {audit.recordedAt ? new Date(audit.recordedAt).toLocaleString() : ""}
              </span>
            )}
            <span style={{ flex: 1 }} />
            <label className="field" style={{ flex: "0 0 auto", minWidth: 0 }}>
              <select aria-label="Explain it in" value={audit.translation?.lang ?? "en"} onChange={(e) => rerun({ lang: e.target.value })}>
                {Object.entries(LANGUAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            {!audit.state && audit.mode === "receive" && (
              <label className="field" style={{ flex: "0 0 auto", minWidth: 0 }}>
                <select aria-label="Your state" value="" onChange={(e) => rerun({ state: e.target.value })}>
                  <option value="">Choose your state for local help</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            )}
            <button className="btn small primary" onClick={() => window.print()}>Evidence packet (PDF)</button>
          </div>

          {audit.mode === "send" && (
            <div className="sender-banner no-print" style={{ marginBottom: 14 }}>
              <b>Sender mode.</b> This is what a family will see. Fix every missing item and aim for a reading level of grade 8 or lower before you send.
            </div>
          )}

          <div className="ws">
            <section className="card ws-left" aria-label="Letter">
              <div className="letter-head">
                <span className="t">The letter</span>
                <span className="legend">
                  <span><i style={{ background: "var(--mark-date)" }} />dates</span>
                  <span><i style={{ background: "var(--mark-cite)" }} />citations</span>
                  <span><i style={{ background: "var(--mark-el)" }} />selected</span>
                </span>
              </div>
              <LetterView audit={audit} focus={focus} activeSentences={active} />
            </section>

            <div className="ws-right">
              {audit.mode === "receive" && <ClockCard audit={audit} jump={jump} />}
              <SummaryCard audit={audit} show={show} />
              <CompletenessCard audit={audit} show={show} />
              {audit.mode === "send" && <ClockCard audit={audit} jump={jump} />}
              <CitationsCard audit={audit} jump={jump} />
              <ReadabilityCard audit={audit} />
              <ReplyCard audit={audit} />
              <HelpCard audit={audit} />
              <GuardCard audit={audit} />
              <RunLog audit={audit} />
            </div>
          </div>
          <Packet audit={audit} />
        </>
      )}

      <footer className="foot no-print">
        <span>Holdline · open source (MIT)</span>
        <span>Runs on NVIDIA Nemotron via Nebius Token Factory · regulation text from ecfr.gov · search by Tavily</span>
      </footer>
    </main>
  );
}
