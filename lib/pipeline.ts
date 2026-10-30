// The Holdline pipeline. Models label, judge, and summarize; code finds, verifies, and
// computes. Anything a model says that code cannot tie back to the letter or the
// regulation is dropped, and the drop is counted in the run log.
import { z } from "zod";
import { detectPack, getPack, STATE_ABBR } from "@/rulepacks";
import type { ClockRule, DateRole, RulePack } from "@/rulepacks/types";
import { chatJSON, chatText, hasNebius, ROLE_WHY } from "./nebius";
import { extract, hasTavily, hostAllowed, searchLocked } from "./tavily";
import { ecfrSectionStatus, fetchEcfrSection, readSnapshot } from "./ecfr";
import { contains, factTokens, newDoneWords, newTimeAnchors, splitSentences, type Sentence } from "./spans";
import { addDays, checkRole, computeRelative, daysUntil, findDates, findRelativeDeadlines, formatLong, guessRole, toIso, fromIso } from "./dates";
import { findCitations } from "./citations";
import { readability } from "./readability";
import { buildReply } from "./reply";
import { LANGUAGE_NAME_EN as LANGUAGES } from "./languages";
import type { AnalyzeInput, Audit, Bullet, CitationResult, ClockItem, ElementResult, HelpGroup, RunStep, SourceUsed, StreamEvent } from "./types";


type Emit = (e: StreamEvent) => void;

class Recorder {
  steps: RunStep[] = [];
  constructor(private emit: Emit) {}
  add(step: RunStep) {
    this.steps.push(step);
    this.emit({ type: "step", step });
  }
  status(message: string) {
    this.emit({ type: "status", message });
  }
}

const STEP_ORDER = ["ingest", "ocr", "pack", "dates", "roles", "regs", "audit", "cites", "clock", "summary", "translate", "help"];

const ROLE_VALUES = ["notice_date", "effective", "keep_by", "respond_by", "meeting", "other"] as const;

function numbered(sentences: Sentence[]) {
  return sentences.map((s) => `[${s.id}] ${s.text.replace(/\s+/g, " ")}`).join("\n");
}

// Same page regardless of http/https, www, case, a trailing slash, or a query string.
function sameUrl(a: string, b: string) {
  const norm = (u: string) => u.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "").replace(/\/$/, "");
  return norm(a) === norm(b);
}

// National directories put each state under a path like lawhelp.org/sc/...; drop other states' pages.
const STATE_CODES = new Set(Object.values(STATE_ABBR).map((a) => a.toLowerCase()));
function otherStatePath(url: string, state: string) {
  const first = new URL(url).pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  return !!first && STATE_CODES.has(first) && first !== STATE_ABBR[state]?.toLowerCase();
}

function detectState(text: string): string | undefined {
  const head = text.slice(0, 1500);
  let best: { name: string; at: number } | undefined;
  for (const name of Object.keys(STATE_ABBR)) {
    const re = new RegExp(`\\b${name}\\b`);
    const m = re.exec(head);
    if (m && (!best || m.index < best.at)) best = { name, at: m.index };
  }
  if (best) return best.name;
  const abbr = /,\s*([A-Z]{2})\s+\d{5}/.exec(head)?.[1];
  return Object.entries(STATE_ABBR).find(([, a]) => a === abbr)?.[0];
}

export async function runPipeline(input: AnalyzeInput, emit: Emit): Promise<Audit> {
  const rec = new Recorder(emit);
  const key = input.nebiusKey || undefined;
  const live = hasNebius(key);
  const tavily = hasTavily();
  const today = input.today && /^\d{4}-\d{2}-\d{2}$/.test(input.today) ? input.today : toIso(new Date());
  const todayDate = fromIso(today);
  const mode = input.mode ?? "receive";

  // 1. Ingest
  let docText = (input.text ?? "").replace(/\r\n/g, "\n");
  if (input.file) {
    const t0 = Date.now();
    if (input.file.mime === "application/pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(Buffer.from(input.file.base64, "base64")));
      const { text } = await extractText(pdf, { mergePages: false });
      docText = (text as string[]).map((p, i) => (text.length > 1 ? `[Page ${i + 1}]\n${p}` : p)).join("\n\n");
      rec.add({ id: "ingest", label: "Read PDF text layer", kind: "code", status: "ok", why: "Digital PDFs carry their own text; no model needed.", ms: Date.now() - t0, detail: `${docText.length} characters` });
    }
    if ((!docText.trim() || input.file.mime.startsWith("image/")) && live) {
      if (input.file.mime === "application/pdf") throw new Error("This PDF is a scan with no text layer. Take a photo of each page and upload the photos instead.");
      rec.status("Reading the photo with Nemotron vision…");
      const r = await chatText({
        role: "vision",
        key,
        system:
          "You transcribe documents. Output the exact text of the document, line by line, preserving wording, numbers, dates, and line breaks. Do not summarize, translate, correct, or add anything. If a word is unreadable write [unreadable].",
        user: [
          { type: "text", text: "Transcribe this letter verbatim." },
          { type: "image_url", image_url: { url: `data:${input.file.mime};base64,${input.file.base64}` } },
        ],
      });
      docText = r.data;
      rec.add({ id: "ocr", label: "Transcribe photo", kind: "model", status: "ok", why: ROLE_WHY.vision, model: r.model, ms: r.ms, tokensIn: r.tokensIn, tokensOut: r.tokensOut, costUsd: r.costUsd, detail: `${docText.length} characters transcribed` });
    } else if (input.file.mime.startsWith("image/")) {
      throw new Error("Reading photos needs a Nebius Token Factory key. Paste the letter text or upload a PDF instead.");
    }
  }
  docText = docText.trim();
  if (docText.length < 40) throw new Error("There is not enough text to check. Paste the full letter.");

  const sentences = splitSentences(docText);
  const ids = new Set(sentences.map((s) => s.id));

  // 2. Notice type
  const pack: RulePack = (input.packId && input.packId !== "auto" && getPack(input.packId)) || detectPack(docText);
  rec.add({ id: "pack", label: `Rule pack: ${pack.short}`, kind: "code", status: "ok", why: "Pattern match on the letter's own words picks which law to check it against.", ms: 0, detail: input.packId && input.packId !== "auto" ? "chosen by user" : "detected from letter text" });

  // 3. Dates: found by code, labeled by Nemotron
  const t3 = Date.now();
  const found = findDates(docText, todayDate);
  const rel = findRelativeDeadlines(docText);
  rec.add({ id: "dates", label: "Find every date on the page", kind: "code", status: "ok", why: "Dates are parsed by code from exact text, never generated.", ms: Date.now() - t3, detail: `${found.length} dates, ${rel.length} relative deadlines (e.g. "within 10 days")` });

  rec.status(live ? "Nemotron and Tavily are checking your letter in parallel…" : "Checking your letter…");
  const roles = new Map<string, DateRole>();
  let modelLabelsRejected = 0;
  const labelTask = (async () => {
  if (found.length && live) {
    try {
      const r = await chatJSON({
        role: "fast",
        key,
        think: false,
        maxTokens: 800,
        schema: z.object({ roles: z.array(z.object({ id: z.string(), role: z.string() })) }),
        system:
          'You label dates in an official letter. For each date id, choose one role: "notice_date" (the date the letter was written or mailed), "effective" (when the change or action takes effect), "keep_by" (act by this date to keep current services or benefits), "respond_by" (another deadline to respond, appeal, or request a hearing), "meeting" (a scheduled meeting), "other". Use only the given ids. Reply with JSON: {"roles":[{"id":"d0","role":"notice_date"}]}',
        user: found.map((d) => `${d.id}: "${d.text}" in: "${d.context}"`).join("\n"),
      });
      for (const { id, role } of r.data.roles) {
        const cand = found.find((d) => d.id === id);
        if (cand && (ROLE_VALUES as readonly string[]).includes(role)) {
          const checked = checkRole(role as DateRole, cand, docText);
          roles.set(id, checked.role);
          if (checked.overruled) modelLabelsRejected++;
        }
        else modelLabelsRejected++;
      }
      rec.add({ id: "roles", label: "Label each date's meaning", kind: "model", status: "ok", why: ROLE_WHY.fast, model: r.model, ms: r.ms, tokensIn: r.tokensIn, tokensOut: r.tokensOut, costUsd: r.costUsd, detail: modelLabelsRejected ? `${modelLabelsRejected} label(s) overruled by code: the sentence did not support them` : "all labels attached to real dates" });
    } catch (e) {
      rec.add({ id: "roles", label: "Label each date's meaning", kind: "model", status: "fallback", why: ROLE_WHY.fast, ms: Date.now() - t3, detail: `Model unavailable (${(e as Error).message.slice(0, 120)}); keyword labels used` });
    }
  }
  })();

  // 4. Regulation text: Tavily Extract, then eCFR API, then bundled snapshot
  const sources: SourceUsed[] = [];
  const regsTask = (async () => {
  const t4 = Date.now();
  const allQuotes = (sourceId: string) => [
    ...pack.elements.filter((e) => e.sourceId === sourceId).map((e) => e.sourceQuote),
    ...pack.clock.filter((c) => c.sourceId === sourceId).map((c) => c.sourceQuote),
    ...(pack.hearingWindowDays?.sourceId === sourceId ? [pack.hearingWindowDays.sourceQuote] : []),
  ];
  let tavilyExtracted: { url: string; raw_content: string }[] = [];
  if (tavily) {
    try {
      tavilyExtracted = await extract(pack.sources.map((s) => s.url));
    } catch {
      tavilyExtracted = [];
    }
  }
  for (const src of pack.sources) {
    const quotes = allQuotes(src.id);
    const tv = tavilyExtracted.find((x) => x.url.replace(/\/$/, "") === src.url);
    if (tv && quotes.every((q) => contains(tv.raw_content, q))) {
      sources.push({ id: src.id, cite: src.cite, url: src.url, via: "tavily", text: tv.raw_content });
      continue;
    }
    try {
      const { text, asOf } = await fetchEcfrSection(src);
      if (quotes.every((q) => contains(text, q))) {
        sources.push({ id: src.id, cite: src.cite, url: src.url, via: "ecfr", asOf, text });
        continue;
      }
    } catch {
      /* fall through to snapshot */
    }
    const snap = readSnapshot(src);
    if (snap) sources.push({ id: src.id, cite: src.cite, url: src.url, via: "snapshot", asOf: snap.asOf, text: snap.text });
  }
  const via = sources.map((s) => s.via);
  rec.add({
    id: "regs",
    label: "Fetch the regulation text",
    kind: "search",
    status: via.includes("snapshot") ? "fallback" : "ok",
    why: "Tavily Extract pulls the live regulation from ecfr.gov; each required clause is matched word-for-word before it is shown.",
    ms: Date.now() - t4,
    urls: pack.sources.map((s) => s.url),
    detail: sources.map((s) => `${s.cite}: ${s.via === "tavily" ? "Tavily Extract (live)" : s.via === "ecfr" ? `eCFR API (live, as of ${s.asOf})` : `bundled snapshot (eCFR as of ${s.asOf})`}`).join(" · "),
  });
  })();

  // 5. Completeness check: Nemotron Ultra judges, code verifies
  const elements: ElementResult[] = [];
  let elementClaimsRejected = 0;
  const base = (e: RulePack["elements"][number]) => ({
    id: e.id, label: e.label, plain: e.plain, cite: e.cite, sourceQuote: e.sourceQuote,
    sourceUrl: pack.sources.find((s) => s.id === e.sourceId)!.url, ask: e.ask, optional: e.optional,
  });
  const auditTask = (async () => {
  let judged = false;
  if (live) {
    const t5 = Date.now();
    try {
      const r = await chatJSON({
        role: "reason",
        key,
        maxTokens: 4000,
        schema: z.object({
          elements: z.array(z.object({ id: z.string(), status: z.enum(["found", "partial", "missing"]), sentences: z.array(z.number()).default([]) })),
        }),
        system: [
          `You audit a ${pack.short} against the federal regulation that says what it must contain.`,
          "You get the letter as numbered sentences and a list of required elements with the exact regulation text.",
          "For each element decide:",
          '- "found": the letter itself clearly provides this element.',
          '- "partial": the letter touches it but does not fully meet the regulation text (for example it mentions "data" without naming each evaluation, or mentions rights without saying how to get a copy).',
          '- "missing": the letter does not provide it.',
          "List the sentence numbers that provide the element. Never cite a sentence that does not contain it. Be strict: a vague phrase is partial, not found.",
          'Reply with JSON only: {"elements":[{"id":"...","status":"found|partial|missing","sentences":[3,4]}]}',
        ].join("\n"),
        user: `REQUIRED ELEMENTS\n${pack.elements.map((e) => `- id: ${e.id} (${e.cite}): "${e.sourceQuote}"`).join("\n")}\n\nLETTER\n${numbered(sentences)}`,
      });
      for (const e of pack.elements) {
        const j = r.data.elements.find((x) => x.id === e.id);
        const valid = (j?.sentences ?? []).filter((n) => ids.has(n));
        let status = j?.status ?? "missing";
        if (status !== "missing" && valid.length === 0) {
          status = "missing";
          elementClaimsRejected++;
        }
        if (j && (j.sentences?.length ?? 0) > valid.length) elementClaimsRejected++;
        elements.push({ ...base(e), status, sentenceIds: status === "missing" ? [] : valid });
      }
      judged = true;
      rec.add({ id: "audit", label: "Check letter against the law", kind: "model", status: "ok", why: ROLE_WHY.reason, model: r.model, ms: r.ms, tokensIn: r.tokensIn, tokensOut: r.tokensOut, costUsd: r.costUsd, detail: elementClaimsRejected ? `${elementClaimsRejected} claim(s) rejected: cited sentences that do not exist` : "every finding points to a real sentence" });
    } catch (e) {
      rec.add({ id: "audit", label: "Check letter against the law", kind: "model", status: "fallback", why: ROLE_WHY.reason, ms: Date.now() - t5, detail: `Model unavailable (${(e as Error).message.slice(0, 120)}); keyword check used` });
    }
  }
  if (!judged) {
    for (const e of pack.elements) {
      const hits = sentences.filter((s) => e.keywords.some((re) => re.test(s.text))).map((s) => s.id);
      elements.push({ ...base(e), status: hits.length ? "found" : "missing", sentenceIds: hits.slice(0, 3) });
    }
    if (!live) rec.add({ id: "audit", label: "Check letter against the law", kind: "code", status: "fallback", why: "Offline mode: keyword detector (add a Nebius key for the Nemotron Ultra audit).", ms: 0 });
  }
  })();

  // 6. Citations printed in the letter
  let offAllowlistRejected = 0;
  const cites: CitationResult[] = [];
  const citeTask = (async () => {
  const t6 = Date.now();
  for (const c of findCitations(docText)) {
    if (c.kind === "cfr" && c.title && c.section) {
      const st = await ecfrSectionStatus(c.title, c.section);
      const url = `https://www.ecfr.gov/current/title-${c.title}/section-${c.section}`;
      cites.push({
        text: c.text, start: c.start, end: c.end, kind: "cfr",
        status: st === null ? "unchecked" : st.status === "exists" ? "verified" : "not_found",
        url: st && st.status !== "missing" ? url : undefined,
        via: "eCFR API",
        note: st === null ? "eCFR could not be reached" : st.status === "exists" ? st.heading : st.status === "reserved" ? `eCFR lists this section as "${st.heading}", so it contains no rule` : "No such section in the Code of Federal Regulations",
      });
      continue;
    }
    if (!tavily) {
      cites.push({ text: c.text, start: c.start, end: c.end, kind: c.kind, status: "unchecked" });
      continue;
    }
    const domains = c.kind === "usc" ? ["uscode.house.gov", "govinfo.gov", "congress.gov"] : [...pack.allowlist, ...(input.state ? pack.help.find((h) => h.id === "state")?.domains(input.state) ?? [] : [])];
    try {
      const { hits, rejected } = await searchLocked(c.kind === "usc" ? `${c.title} U.S.C. ${c.section}` : c.text, domains, 5);
      offAllowlistRejected += rejected.length;
      const num = (c.section ?? c.text.match(/[\d.]+[a-z]?$/)?.[0] ?? "").toLowerCase();
      const hit = hits.find((h) => num && (h.url.toLowerCase().includes(num) || h.content.toLowerCase().includes(num) || h.title.toLowerCase().includes(num)));
      cites.push({ text: c.text, start: c.start, end: c.end, kind: c.kind, status: hit ? "verified" : "not_found", url: hit?.url, via: "Tavily (domain-locked)", note: hit ? hit.title : "Could not be located on the allowed official sources" });
    } catch {
      cites.push({ text: c.text, start: c.start, end: c.end, kind: c.kind, status: "unchecked" });
    }
  }
  if (cites.length)
    rec.add({ id: "cites", label: "Check citations printed in the letter", kind: "search", status: "ok", why: "A citation that does not exist is a red flag. CFR sections are checked against eCFR; others via Tavily on allowed domains only.", ms: Date.now() - t6, detail: `${cites.filter((c) => c.status === "verified").length} verified, ${cites.filter((c) => c.status === "not_found").length} not found, ${cites.filter((c) => c.status === "unchecked").length} unchecked`, urls: cites.map((c) => c.url).filter(Boolean) as string[] });
  })();

  // 8. Plain-language summary: Nemotron writes, code guards
  let summary: Bullet[] = [];
  let summaryDropped = 0;
  const summaryTask = (async () => {
  if (live) {
    const t8 = Date.now();
    try {
      const r = await chatJSON({
        role: "compose",
        key,
        think: false,
        jsonMode: false,
        maxTokens: 1200,
        schema: z.object({ bullets: z.array(z.object({ text: z.string(), sentences: z.array(z.number()) })) }),
        system:
          "You explain an official letter to a stressed family at a 6th-grade reading level. Write 3 to 6 short bullets about what the letter says. Each bullet must list the sentence numbers it is based on. Use only facts in those sentences: do not add numbers, dates, names, amounts, or legal claims that are not in them. Keep key amounts and dates exactly as written, because the family needs them. Keep what each deadline counts from exactly as the letter says it (for example 'the date of this notice'); never say 'today' or 'from now'. Keep the letter's tense: what will happen is still in the future. Use short, everyday words, not the letter's wording. Write each bullet as one complete sentence with normal punctuation: apostrophes (child's), hyphens (one-on-one), commas in dates (November 16, 2026), and a period at the end. No advice. JSON only: {\"bullets\":[{\"text\":\"...\",\"sentences\":[1,2]}]}",
        user: numbered(sentences),
      });
      for (const b of r.data.bullets) {
        const sids = b.sentences.filter((n) => ids.has(n));
        const srcText = sids.map((n) => sentences[n].text).join(" ");
        const srcTok = new Set(factTokens(srcText));
        const ok = sids.length > 0 && factTokens(b.text).every((t) => srcTok.has(t) || srcText.includes(t)) && newTimeAnchors(b.text, srcText).length === 0 && newDoneWords(b.text, srcText).length === 0;
        if (ok) summary.push({ text: /[.!?]$/.test(b.text.trim()) ? b.text.trim() : `${b.text.trim()}.`, sentenceIds: sids });
        else summaryDropped++;
      }
      rec.add({ id: "summary", label: "Plain-language summary", kind: "model", status: "ok", why: ROLE_WHY.compose, model: r.model, ms: r.ms, tokensIn: r.tokensIn, tokensOut: r.tokensOut, costUsd: r.costUsd, detail: `${summary.length} kept, ${summaryDropped} dropped by the fact guard (a number, date, time word, or "already happened" word not in the cited sentences)` });
    } catch (e) {
      rec.add({ id: "summary", label: "Plain-language summary", kind: "model", status: "error", why: ROLE_WHY.compose, ms: Date.now() - t8, detail: (e as Error).message.slice(0, 160) });
    }
  }
  })();

  // 10. Find help (Tavily, domain-locked)
  const state = Object.entries(STATE_ABBR).find(([, a]) => a === input.state?.toUpperCase())?.[0] || input.state || detectState(docText);
  const help: HelpGroup[] = [];
  const helpTask = (async () => {
  if (mode === "receive" && tavily && state) {
    const t10 = Date.now();
    const urls: string[] = [];
    await Promise.all(
      pack.help.map(async (h) => {
        try {
          const domains = h.domains(state);
          const { hits, rejected } = await searchLocked(h.query(state), domains, 8);
          offAllowlistRejected += rejected.length;
          const st = state.toLowerCase();
          const relevant = hits
            .filter((x) => hostAllowed(x.url, domains))
            .filter((x) => h.allowPdf || !/\.pdf($|\?)/i.test(x.url))
            .filter((x) => !h.topic || h.topic.test(`${x.title} ${x.url}`) || new URL(x.url).pathname.split("/").filter(Boolean).length <= 1)
            .filter((x) => !/sign[ -]?on|sign[ -]?in|log[ -]?in/i.test(`${x.title} ${x.url}`))
            .filter((x) => !otherStatePath(x.url, state))
            .filter((x, i, all) => all.findIndex((y) => sameUrl(y.url, x.url)) === i)
            .filter((x) => !h.mustMentionState || `${x.title} ${x.content} ${x.url}`.toLowerCase().includes(st) || new URL(x.url).hostname.includes(st.replace(/[^a-z]/g, "")));
          const results = [
            ...(h.fixed ?? []).map((f) => ({ title: f.title, url: f.url })),
            ...relevant.slice(0, 3).map((x) => ({ title: x.title, url: x.url, snippet: x.content.slice(0, 220) })),
          ];
          urls.push(...results.map((r) => r.url));
          help.push({ id: h.id, label: h.label, results });
        } catch {
          help.push({ id: h.id, label: h.label, results: (h.fixed ?? []).map((f) => ({ title: f.title, url: f.url })) });
        }
      }),
    );
    help.sort((a, b) => pack.help.findIndex((h) => h.id === a.id) - pack.help.findIndex((h) => h.id === b.id));
    rec.add({ id: "help", label: `Find help in ${state}`, kind: "search", status: "ok", why: "Tavily search locked to parent-center, legal-aid, and state .gov domains; every URL re-checked against the allowlist.", ms: Date.now() - t10, urls, detail: `${urls.length} sources${offAllowlistRejected ? `, ${offAllowlistRejected} off-allowlist result(s) rejected` : ""}` });
  }
  })();

  await Promise.all([labelTask, regsTask, auditTask, citeTask, summaryTask, helpTask]);
  const dates = found.map((d) => ({ ...d, role: roles.get(d.id) ?? guessRole(d, docText) }));

  // 7. The Clock (deterministic)
  const noticeDate = dates.find((d) => d.role === "notice_date");
  const ruleFor = (role: DateRole): ClockRule | undefined => pack.clock.find((c) => c.role === role);
  const ruleView = (r: ClockRule) => ({ cite: r.cite, quote: r.sourceQuote, url: pack.sources.find((s) => s.id === r.sourceId)!.url, meaning: r.meaning, action: r.action });
  const items: ClockItem[] = [];
  let unreadableReason: string | undefined;

  const relOut = rel.map((r) => ({ ...r, computed: noticeDate ? computeRelative(r, noticeDate.iso, noticeDate.text) : undefined }));
  for (const r of relOut) {
    if (!r.computed) {
      unreadableReason = `The letter says "${r.text}", but no letter date could be found on the page to count from.`;
      continue;
    }
    const isKeep = /continu|keep|remain/i.test(r.context);
    const rule = isKeep ? ruleFor("keep_by") ?? ruleFor("effective") : undefined;
    items.push({
      kind: isKeep ? "keep" : "respond",
      label: isKeep ? `Act by this date to keep your ${pack.keepNoun}` : "Respond by",
      iso: r.computed.iso,
      daysLeft: daysUntil(r.computed.iso, todayDate),
      span: { start: r.start, end: r.end },
      steps: r.computed.steps,
      conservative: r.computed.conservative,
      rule: rule ? ruleView(rule) : undefined,
    });
  }
  for (const d of dates) {
    if (d.role === "keep_by" || d.role === "respond_by") {
      // "before December 1" means the last safe day is November 30.
      const strict = /\b(before|prior to)\s*$/i.test(docText.slice(Math.max(0, d.start - 12), d.start));
      const iso = strict ? addDays(d.iso, -1) : d.iso;
      const steps = [`The letter says: "${d.context}"`];
      if (strict) steps.push(`"Before ${d.text}" means the last full day to act is ${formatLong(iso)}.`);
      const keepIt = d.role === "keep_by";
      const rule = keepIt ? ruleFor("keep_by") ?? ruleFor("effective") : undefined;
      items.push({
        kind: keepIt ? "keep" : "respond",
        label: keepIt ? `Act by this date to keep your ${pack.keepNoun}` : "Respond by",
        iso,
        daysLeft: daysUntil(iso, todayDate),
        span: { start: d.start, end: d.end },
        steps,
        rule: rule ? ruleView(rule) : undefined,
      });
    } else if (d.role === "meeting") {
      items.push({ kind: "meeting", label: "Meeting", iso: d.iso, daysLeft: daysUntil(d.iso, todayDate), span: { start: d.start, end: d.end } });
    } else if (d.role === "effective") {
      const rule = ruleFor("effective");
      items.push({ kind: "effective", label: "The change takes effect", iso: d.iso, daysLeft: daysUntil(d.iso, todayDate), span: { start: d.start, end: d.end }, rule: rule ? ruleView(rule) : undefined, steps: [`The letter says: "${d.context}"`] });
    }
  }
  // No stated keep-by date: the rule pack says act before the effective date.
  const effective = items.filter((i) => i.kind === "effective").sort((a, b) => a.iso.localeCompare(b.iso))[0];
  if (!items.some((i) => i.kind === "keep") && effective?.rule) {
    const iso = addDays(effective.iso, -1);
    items.push({
      kind: "keep",
      label: `Act before this date to keep your ${pack.keepNoun}`,
      iso,
      daysLeft: daysUntil(iso, todayDate),
      span: effective.span,
      steps: [...(effective.steps ?? []), `${effective.rule.cite} protects you when you act before the change takes effect.`, `The last full day before ${formatLong(effective.iso)} is ${formatLong(iso)}.`],
      rule: effective.rule,
    });
  }
  if (pack.hearingWindowDays && noticeDate) {
    const iso = addDays(noticeDate.iso, pack.hearingWindowDays.days);
    items.push({
      kind: "hearing_window",
      label: pack.hearingWindowDays.label,
      iso,
      daysLeft: daysUntil(iso, todayDate),
      span: { start: noticeDate.start, end: noticeDate.end },
      steps: [`The letter is dated "${noticeDate.text}".`, `${formatLong(noticeDate.iso)} + ${pack.hearingWindowDays.days} days = ${formatLong(iso)}.`],
      rule: { cite: pack.hearingWindowDays.cite, quote: pack.hearingWindowDays.sourceQuote, url: pack.sources.find((s) => s.id === pack.hearingWindowDays!.sourceId)!.url, meaning: "This is the outer limit for asking for a hearing. Your benefits only continue if you ask by the earlier date.", action: "Request a hearing by this date at the latest." },
    });
  }
  const order = { keep: 0, respond: 1, effective: 2, hearing_window: 3, meeting: 4 };
  items.sort((a, b) => order[a.kind] - order[b.kind] || a.iso.localeCompare(b.iso));
  const upcoming = (k: ClockItem["kind"][]) => items.filter((i) => k.includes(i.kind) && i.daysLeft >= 0).sort((a, b) => a.iso.localeCompare(b.iso) || order[a.kind] - order[b.kind])[0];
  const primary = upcoming(["keep", "respond"]) ?? upcoming(["effective", "hearing_window", "meeting"]) ?? items[0];
  const unreadable = !primary;
  if (unreadable && !unreadableReason) unreadableReason = "No deadline or effective date could be found printed on this letter. Ask the sender, in writing, for the date the change takes effect.";
  rec.add({ id: "clock", label: "Compute the deadlines", kind: "code", status: "ok", why: "Date math is done in code from the exact sentence, with every step shown.", ms: 0, detail: primary ? `${primary.label}: ${formatLong(primary.iso)} (${primary.daysLeft} days)` : "no verifiable date, so the clock shows unreadable" });

  // 9. Translation: quotes stay original; translated text is fact-guarded
  let translation: Audit["translation"];
  let translationDropped = 0;
  const lang = input.lang && input.lang !== "en" ? input.lang : undefined;
  if (lang && live && LANGUAGES[lang]) {
    const t9 = Date.now();
    const items9 = [...summary.map((b) => b.text), primary?.rule?.action ?? "", primary?.rule?.meaning ?? ""];
    try {
      const r = await chatJSON({
        role: "fast",
        key,
        think: false,
        maxTokens: 2000,
        schema: z.object({ items: z.array(z.string()) }),
        system: `Translate each item into ${LANGUAGES[lang]} at a simple reading level. Translate every word, including month names and words like "days" and "fair hearing". Keep every digit, amount, and legal citation (like 42 CFR 431.230) exactly as written. Return the same number of items in the same order. JSON only: {"items":["..."]}`,
        user: JSON.stringify({ items: items9 }),
      });
      const out = items9.map((orig, i) => {
        const t = r.data.items[i] ?? "";
        const origTok = new Set(factTokens(orig));
        if (orig && (!t || !factTokens(t).every((x) => origTok.has(x)))) {
          translationDropped++;
          return "";
        }
        return t;
      });
      translation = { lang, bullets: out.slice(0, summary.length), clockAction: out[summary.length] || undefined, clockMeaning: out[summary.length + 1] || undefined };
      rec.add({ id: "translate", label: `Translate to ${LANGUAGES[lang]}`, kind: "model", status: "ok", why: ROLE_WHY.fast, model: r.model, ms: r.ms, tokensIn: r.tokensIn, tokensOut: r.tokensOut, costUsd: r.costUsd, detail: translationDropped ? `${translationDropped} item(s) dropped: numbers changed in translation` : "numbers and dates preserved" });
    } catch (e) {
      rec.add({ id: "translate", label: `Translate to ${LANGUAGES[lang]}`, kind: "model", status: "error", why: ROLE_WHY.fast, ms: Date.now() - t9, detail: (e as Error).message.slice(0, 160) });
    }
  }

  // 11. Reply (deterministic)
  const keep = items.find((i) => i.kind === "keep" && i.daysLeft >= 0);
  const reply = mode === "receive" ? buildReply({ pack, elements, sentences, noticeDateText: noticeDate?.text, keep }) : "";

  return {
    runMode: live ? "live" : "offline",
    mode,
    packId: pack.id,
    packName: pack.name,
    packShort: pack.short,
    docText,
    today,
    sentences,
    dates,
    relative: relOut,
    clock: { primary, items, unreadable, unreadableReason: unreadable ? unreadableReason : undefined },
    elements,
    citations: cites,
    sources: sources.map(({ text: _text, ...s }) => s),
    readability: readability(docText),
    plainLanguage: pack.plainLanguage ? { cite: pack.plainLanguage.cite, quote: pack.plainLanguage.sourceQuote } : undefined,
    summary,
    translation,
    state,
    help,
    reply,
    verifier: {
      datesFound: found.length + rel.length,
      modelLabelsRejected,
      elementClaimsRejected,
      summaryDropped,
      translationDropped,
      offAllowlistRejected,
    },
    steps: [...rec.steps].sort((a, b) => STEP_ORDER.indexOf(a.id) - STEP_ORDER.indexOf(b.id)),
  };
}
