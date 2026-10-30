"use client";
import { useState } from "react";
import type { Audit, ClockItem, ElementResult } from "@/lib/types";
import { download, formatLong, formatShort, makeIcs, speak } from "@/lib/client";
import { LANGUAGES } from "@/lib/languages";

type Jump = (start: number, end: number) => void;
type ShowSentences = (ids: number[]) => void;

const dayWord = (n: number) => (Math.abs(n) === 1 ? "day" : "days");

/* The Clock */
export function ClockCard({ audit, jump }: { audit: Audit; jump: Jump }) {
  const { primary, items, unreadable, unreadableReason } = audit.clock;
  const [open, setOpen] = useState(false);
  const tr = audit.translation;

  if (unreadable || !primary) {
    return (
      <section className="card clock unread">
        <div className="clock-main">
          <div className="clock-num"><div className="n">?</div><div className="u">no date found</div></div>
          <div>
            <div className="what">Date unreadable</div>
            <div className="when">Holdline will not guess a deadline.</div>
            <div className="act">{unreadableReason}</div>
          </div>
        </div>
      </section>
    );
  }

  const past = primary.daysLeft < 0;
  const calm = primary.daysLeft > 30;
  const sender = audit.mode === "send";
  const icsTitle = `${primary.label}: ${audit.packShort}`;

  return (
    <section className={`card clock ${calm ? "calm" : ""}`} aria-label="Deadline">
      <div className="clock-main">
        <div className="clock-num">
          <div className="n">{past ? "0" : primary.daysLeft}</div>
          <div className="u">{past ? "date has passed" : `${dayWord(primary.daysLeft)} left`}</div>
        </div>
        <div>
          <div className="what">{primary.label}</div>
          <div className="when">{formatLong(primary.iso)}</div>
          {primary.rule && !sender && (
            <div className="act">
              <b>{primary.rule.action}</b>
              {tr?.clockAction && <span className="tr">{tr.clockAction}</span>}
            </div>
          )}
          {primary.conservative && <div className="src" style={{ marginTop: 6 }}>Earliest possible date, so it is the safe one to use.</div>}
          <div className="actions no-print">
            {primary.span && <button className="btn small" onClick={() => jump(primary.span!.start, primary.span!.end)}>Show in letter</button>}
            {!sender && (
              <button
                className="btn small"
                onClick={() =>
                  download("holdline-deadline.ics", makeIcs({ iso: primary.iso, title: icsTitle, description: `${primary.rule?.action ?? ""}\n\nFrom Holdline. ${primary.rule?.cite ?? ""}` }), "text/calendar")
                }
              >
                Add to calendar
              </button>
            )}
            <button className="btn small ghost" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Hide" : "Show"} the math and the law</button>
          </div>
        </div>
      </div>
      {open && (
        <div className="clock-more">
          {primary.steps && (
            <>
              <div className="byline">How this date was computed</div>
              <ol className="math">{primary.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </>
          )}
          {primary.rule && (
            <>
              <div className="byline" style={{ marginTop: 12 }}>What the law says · {primary.rule.cite}</div>
              <div className="quote law">“{primary.rule.quote}”</div>
              <div className="src"><a href={primary.rule.url} target="_blank" rel="noreferrer">{primary.rule.url.replace("https://www.", "")}</a></div>
              <div className="explain"><b>What this means:</b> {primary.rule.meaning}{tr?.clockMeaning && <span className="tr">{tr.clockMeaning}</span>}</div>
            </>
          )}
          {items.length > 1 && (
            <>
              <div className="byline" style={{ marginTop: 14 }}>Every date on this letter</div>
              <div className="timeline">
                {items.map((i: ClockItem, k) => (
                  <button key={k} onClick={() => i.span && jump(i.span.start, i.span.end)}>
                    <span>{i.label}</span>
                    <span className="d">{formatShort(i.iso)} · {i.daysLeft < 0 ? "passed" : `${i.daysLeft} ${dayWord(i.daysLeft)}`}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

/* Summary */
export function SummaryCard({ audit, show }: { audit: Audit; show: ShowSentences }) {
  const lang = audit.translation?.lang ?? "en";
  const [speaking, setSpeaking] = useState(false);
  if (!audit.summary.length) return null;
  const readText = () => {
    const t = audit.translation?.bullets.filter(Boolean).length ? audit.translation.bullets.join(". ") : audit.summary.map((b) => b.text).join(". ");
    setSpeaking(speak(t, audit.translation?.bullets.filter(Boolean).length ? lang : "en"));
  };
  return (
    <section className="card card-pad" aria-label="Plain-language summary">
      <div className="k-title">
        <h3>What the letter says</h3>
        <span className="spacer" />
        <button className="btn small no-print" onClick={readText}>{speaking ? "Read again" : "Read aloud"}</button>
      </div>
      <ul className="bullets">
        {audit.summary.map((b, i) => (
          <li key={i}>
            {b.text}
            {audit.translation?.bullets[i] && <span className="tr" lang={lang}>{audit.translation.bullets[i]}</span>}
            <button className="linkbtn refs no-print" onClick={() => show(b.sentenceIds)}>see in letter</button>
          </li>
        ))}
      </ul>
      <div className="src" style={{ marginTop: 10 }}>
        Written by Nemotron, checked by code: each line points to the letter sentences it came from, and any line that adds a number, a date, a time word like “today”, or says something already happened when the letter does not, was removed{audit.verifier.summaryDropped ? ` (${audit.verifier.summaryDropped} removed)` : ""}.
        {audit.translation && ` Translation to ${LANGUAGES[audit.translation.lang] ?? audit.translation.lang} is machine-made; the quotes stay in the original.`}
      </div>
    </section>
  );
}

/* Completeness check */
const MARK = { found: "✓", partial: "!", missing: "✕" } as const;
const WORD = { found: "In the letter", partial: "Only in part", missing: "Missing" } as const;

export function CompletenessCard({ audit, show }: { audit: Audit; show: ShowSentences }) {
  const [open, setOpen] = useState<string | null>(null);
  const counted = audit.elements.filter((e) => !(e.optional && e.status === "missing"));
  const n = (s: ElementResult["status"]) => counted.filter((e) => e.status === s).length;
  const sender = audit.mode === "send";
  return (
    <section className="card card-pad" aria-label="Completeness check">
      <div className="k-title">
        <h3>{sender ? "Before you send: what the law requires" : "What the law says this letter must include"}</h3>
      </div>
      <div className="score">
        <span><span className="badge found">{MARK.found}</span>{n("found")} included</span>
        <span><span className="badge partial">{MARK.partial}</span>{n("partial")} only in part</span>
        <span><span className="badge missing">{MARK.missing}</span>{n("missing")} missing</span>
      </div>
      <div className="els">
        {audit.elements.map((e) => {
          const isOpen = open === e.id;
          return (
            <div className="el" key={e.id}>
              <button
                aria-expanded={isOpen}
                onClick={() => {
                  setOpen(isOpen ? null : e.id);
                  if (!isOpen && e.sentenceIds.length) show(e.sentenceIds);
                }}
              >
                <span className={`badge ${e.status}`}>{MARK[e.status]}</span>
                <span className="lbl">
                  {e.label}
                  {e.optional && <span className="pl">Required only when it applies</span>}
                </span>
                <span className={`status-txt ${e.status}`}>{WORD[e.status]}</span>
              </button>
              {isOpen && (
                <div className="el-body">
                  <div className="byline">The law · {e.cite}</div>
                  <div className="quote law">“{e.sourceQuote}”</div>
                  <div className="src"><a href={e.sourceUrl} target="_blank" rel="noreferrer">Read it on ecfr.gov</a></div>
                  {e.sentenceIds.length > 0 ? (
                    <>
                      <div className="byline" style={{ marginTop: 10 }}>The letter</div>
                      {e.sentenceIds.map((id) => (
                        <div key={id} className="quote letter-q">“{audit.sentences[id]?.text}”</div>
                      ))}
                    </>
                  ) : (
                    <div className="explain"><b>Not found in this letter.</b> {e.plain}</div>
                  )}
                  {e.status === "partial" && <div className="explain"><b>Why only in part:</b> the letter mentions this, but not everything the rule above asks for. {e.plain}</div>}
                  {sender && e.status !== "found" && <div className="explain"><b>To fix:</b> add {e.ask}.</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="src" style={{ marginTop: 10 }}>
        {audit.runMode === "offline"
          ? "Offline mode: checked with keyword matching. Live mode uses Nemotron 3 Ultra."
          : `Judged by Nemotron 3 Ultra; every “in the letter” points to a real sentence${audit.verifier.elementClaimsRejected ? ` (${audit.verifier.elementClaimsRejected} unsupported claim(s) rejected)` : ""}.`}
      </div>
    </section>
  );
}

/* Readability */
export function ReadabilityCard({ audit }: { audit: Audit }) {
  const g = audit.readability.grade;
  const pct = Math.min(100, (g / 18) * 100);
  const color = g <= 8 ? "var(--green)" : g <= 11 ? "var(--amber)" : "var(--red)";
  return (
    <section className="card card-pad" aria-label="Readability">
      <div className="k-title">
        <h3>How hard is this letter to read?</h3>
        <span className="spacer" />
        <span className="cite">Flesch–Kincaid</span>
      </div>
      <div style={{ fontSize: 15 }}>
        Reading level: <b style={{ color }}>grade {g}</b>. Plain-language guidance aims for grade 6–8.
      </div>
      <div className="meter" aria-hidden>
        <span style={{ width: `${pct}%`, background: color }} />
        <i className="target" style={{ left: `${(8 / 18) * 100}%` }} />
      </div>
      <div className="src">
        {audit.readability.words} words · longest sentence {audit.readability.longestSentenceWords} words.
        {audit.plainLanguage && <> The rule for this notice says it must be: “{audit.plainLanguage.quote}” ({audit.plainLanguage.cite}).</>}
      </div>
    </section>
  );
}

/* Citations */
export function CitationsCard({ audit, jump }: { audit: Audit; jump: Jump }) {
  if (!audit.citations.length) return null;
  return (
    <section className="card card-pad" aria-label="Citations">
      <div className="k-title"><h3>Laws the letter cites</h3></div>
      <div className="cites">
        {audit.citations.map((c, i) => (
          <div className="cite-row" key={i}>
            <span className={`badge ${c.status === "verified" ? "found" : c.status === "not_found" ? "missing" : "partial"}`}>
              {c.status === "verified" ? "✓" : c.status === "not_found" ? "✕" : "?"}
            </span>
            <div>
              <button className="linkbtn" onClick={() => jump(c.start, c.end)}>{c.text}</button>{" "}
              <span className={`status-txt ${c.status === "verified" ? "found" : c.status === "not_found" ? "missing" : "partial"}`}>
                {c.status === "verified" ? "Real rule" : c.status === "not_found" ? "Does not support this letter" : "Not checked"}
              </span>
              <div className="src">
                {c.note}
                {c.url && <> · <a href={c.url} target="_blank" rel="noreferrer">source</a></>}
                {c.via && <> · checked via {c.via}</>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* Help */
export function HelpCard({ audit }: { audit: Audit }) {
  if (audit.mode === "send") return null;
  const any = audit.help.some((g) => g.results.length);
  return (
    <section className="card card-pad" aria-label="Find help">
      <div className="k-title">
        <h3>Free help{audit.state ? ` in ${audit.state}` : ""}</h3>
        <span className="spacer" />
        <span className="cite">Tavily · trusted sites only</span>
      </div>
      {!audit.state && <div className="src">Choose your state to find a Parent Center, legal aid, and the official hearing page.</div>}
      {audit.state && !any && (
        <div className="src">
          Live search needs a Tavily key. Meanwhile: <a href="https://www.parentcenterhub.org/find-your-center/" target="_blank" rel="noreferrer">find your Parent Center</a> ·{" "}
          <a href="https://www.lsc.gov/about-lsc/what-legal-aid/get-legal-help" target="_blank" rel="noreferrer">find free legal aid (LSC)</a>
        </div>
      )}
      {audit.help.map((g) =>
        g.results.length ? (
          <div className="help-group" key={g.id}>
            <h4>{g.label}</h4>
            <ul>
              {g.results.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noreferrer">{r.title || r.url}</a> <span className="host">{new URL(r.url).hostname}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </section>
  );
}

/* Reply */
export function ReplyCard({ audit }: { audit: Audit }) {
  const [copied, setCopied] = useState(false);
  if (audit.mode === "send" || !audit.reply) return null;
  const parts = audit.reply.split(/(\[[A-Z' ]+\])/g);
  return (
    <section className="card card-pad" aria-label="Reply letter">
      <div className="k-title">
        <h3>Your reply, ready tonight</h3>
        <span className="spacer" />
        <span className="cite">template + quotes + blanks</span>
      </div>
      <div className="reply">
        {parts.map((p, i) => (/^\[[A-Z' ]+\]$/.test(p) ? <span className="slot" key={i}>{p}</span> : <span key={i}>{p}</span>))}
      </div>
      <div className="actions no-print">
        <button
          className="btn small"
          onClick={async () => {
            await navigator.clipboard.writeText(audit.reply);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button className="btn small" onClick={() => download("holdline-reply.txt", audit.reply, "text/plain")}>Download .txt</button>
      </div>
      <div className="src" style={{ marginTop: 8 }}>
        No AI wrote this letter. It is fixed wording, exact quotes from your notice, and blanks (highlighted) for you to fill in. Keep a copy and note the date you send it.
      </div>
    </section>
  );
}

/* Guard stats */
export function GuardCard({ audit }: { audit: Audit }) {
  const v = audit.verifier;
  const blocked = v.modelLabelsRejected + v.elementClaimsRejected + v.summaryDropped + v.translationDropped;
  return (
    <section className="card card-pad" aria-label="Accuracy guard">
      <div className="k-title"><h3>Accuracy guard</h3><span className="spacer" /><span className="cite">this run</span></div>
      <div className="guard">
        <div><b>{v.datesFound}</b><span>dates found by code, none generated</span></div>
        <div><b>{blocked}</b><span>AI statements blocked for not matching the letter</span></div>
        <div><b>{audit.sources.length}</b><span>regulations quoted word-for-word from ecfr.gov</span></div>
      </div>
    </section>
  );
}

/* Run log */
export function RunLog({ audit }: { audit: Audit }) {
  const cost = audit.steps.reduce((n, s) => n + (s.costUsd ?? 0), 0);
  const ms = audit.steps.reduce((n, s) => n + s.ms, 0);
  const models = [...new Set(audit.steps.map((s) => s.model).filter(Boolean))];
  return (
    <section className="card card-pad log no-print" aria-label="Run log">
      <details>
        <summary>
          <h3 style={{ fontSize: 16 }}>Run log</h3>
          <span className="spacer" style={{ flex: 1 }} />
          <span className="cite">{models.length} Nemotron model{models.length === 1 ? "" : "s"} · {(ms / 1000).toFixed(1)}s · est. ${cost.toFixed(4)}</span>
        </summary>
        <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>Step</th><th>Engine</th><th>Time</th><th>Tokens</th><th>Notes</th></tr></thead>
          <tbody>
            {audit.steps.map((s) => (
              <tr key={s.id + s.label}>
                <td>
                  <b>{s.label}</b>
                  <div className="why">{s.why}</div>
                </td>
                <td>{s.model ? <span className="model">{s.model}</span> : <span className="why">{s.kind === "search" ? "Tavily / eCFR" : "code"}</span>}{s.status !== "ok" && <div className="status-txt partial">{s.status}</div>}</td>
                <td className="num">{s.ms ? `${(s.ms / 1000).toFixed(2)}s` : "-"}</td>
                <td className="num">{s.tokensIn ? `${s.tokensIn}→${s.tokensOut}` : "-"}{s.costUsd ? <div>${s.costUsd.toFixed(5)}</div> : null}</td>
                <td>
                  <div className="why">{s.detail}</div>
                  {s.urls?.length ? <div className="urls">{s.urls.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer">{u}</a>)}</div> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="src" style={{ marginTop: 8 }}>Costs are estimates from public per-token prices. Nothing you upload is stored.</div>
      </details>
    </section>
  );
}

/* Evidence Packet (print only) */
export function Packet({ audit }: { audit: Audit }) {
  const p = audit.clock.primary;
  return (
    <div className="packet">
      <h1>Holdline Evidence Packet</h1>
      <div className="small">{audit.packShort} · prepared {formatLong(audit.today)} · not legal advice</div>
      {p && (
        <section>
          <h2>Deadline</h2>
          <p><b>{p.label}: {formatLong(p.iso)}</b> ({p.daysLeft} days from {formatLong(audit.today)})</p>
          {p.steps && <ol>{p.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>}
          {p.rule && <p className="q">{p.rule.cite}: “{p.rule.quote}” ({p.rule.url})</p>}
        </section>
      )}
      <section>
        <h2>Required contents of the notice</h2>
        <table>
          <thead><tr><th>Requirement</th><th>Status</th><th>Where in the letter</th></tr></thead>
          <tbody>
            {audit.elements.map((e) => (
              <tr key={e.id}>
                <td><b>{e.label}</b><div className="small">{e.cite}: “{e.sourceQuote}”</div></td>
                <td>{WORD[e.status]}</td>
                <td className="q">{e.sentenceIds.map((id) => `“${audit.sentences[id]?.text}”`).join(" ") || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {audit.citations.length > 0 && (
        <section>
          <h2>Citations in the letter</h2>
          <ul>{audit.citations.map((c, i) => <li key={i}>{c.text}: {c.status === "verified" ? "verified" : c.status === "not_found" ? "does not support this letter" : "not checked"} {c.note ? `(${c.note})` : ""}</li>)}</ul>
        </section>
      )}
      <section>
        <h2>Readability</h2>
        <p>Flesch–Kincaid grade {audit.readability.grade} ({audit.readability.words} words).</p>
      </section>
      {audit.help.some((g) => g.results.length) && (
        <section>
          <h2>Where to get help</h2>
          {audit.help.map((g) => g.results.length ? <div key={g.id}><b>{g.label}</b><ul>{g.results.map((r) => <li key={r.url}>{r.title}: {r.url}</li>)}</ul></div> : null)}
        </section>
      )}
      {audit.reply && (
        <section className="pb">
          <h2>Reply letter</h2>
          <pre>{audit.reply}</pre>
        </section>
      )}
      <section>
        <h2>The letter as checked</h2>
        <pre>{audit.docText}</pre>
      </section>
      <p className="small">Holdline shows what the letter says and what the regulation says. It is not legal advice. Regulation text from ecfr.gov.</p>
    </div>
  );
}
