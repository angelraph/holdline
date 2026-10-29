// Exact-span machinery. Every quote Holdline shows is located in a source string
// here, with offsets, or it is not shown.

export type Span = { start: number; end: number; text: string };
export type Sentence = Span & { id: number };

const FOLD: Record<string, string> = {
  "‘": "'", "’": "'", "‚": "'", "‛": "'", "′": "'",
  "“": '"', "”": '"', "„": '"', "″": '"',
  "–": "-", "—": "-", "‒": "-", "−": "-", "­": "",
  " ": " ", " ": " ", " ": " ",
};

/**
 * Normalize for matching (case, curly quotes, dashes, whitespace) while keeping a map
 * from each normalized character back to its offset in the original string.
 */
export function normalizeWithMap(src: string): { norm: string; map: number[] } {
  let norm = "";
  const map: number[] = [];
  let lastSpace = true;
  for (let i = 0; i < src.length; i++) {
    let ch = src[i];
    if (ch in FOLD) ch = FOLD[ch];
    if (ch === "") continue;
    if (/\s/.test(ch)) {
      if (lastSpace) continue;
      norm += " ";
      map.push(i);
      lastSpace = true;
      continue;
    }
    norm += ch.toLowerCase();
    map.push(i);
    lastSpace = false;
  }
  if (norm.endsWith(" ")) {
    norm = norm.slice(0, -1);
    map.pop();
  }
  return { norm, map };
}

export function normalize(s: string): string {
  return normalizeWithMap(s).norm;
}

/** Find `quote` in `doc`. Returns the original-text span, or null if it is not there. */
export function findSpan(doc: string, quote: string, from = 0): Span | null {
  const q = normalize(quote).replace(/^["'\s.]+|["'\s.]+$/g, "");
  if (q.length < 3) return null;
  const { norm, map } = normalizeWithMap(doc);
  let startNorm = 0;
  if (from > 0) {
    startNorm = map.findIndex((o) => o >= from);
    if (startNorm < 0) return null;
  }
  const idx = norm.indexOf(q, startNorm);
  if (idx < 0) return null;
  const start = map[idx];
  const end = map[idx + q.length - 1] + 1;
  return { start, end, text: doc.slice(start, end) };
}

export function contains(doc: string, quote: string): boolean {
  return findSpan(doc, quote) !== null;
}

/**
 * Split into sentences with offsets. Conservative about abbreviations common in
 * notices (CFR, U.S.C., Dr., No.) and treats blank lines / list items as boundaries.
 */
export function splitSentences(doc: string): Sentence[] {
  const out: Sentence[] = [];
  const ABBR = /\b(?:U\.S\.C|C\.F\.R|Dr|Mr|Mrs|Ms|No|Sec|St|Inc|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|e\.g|i\.e|etc|vs|p|pp)\.$/i;
  let start = 0;
  const push = (s: number, e: number) => {
    while (s < e && /\s/.test(doc[s])) s++;
    while (e > s && /\s/.test(doc[e - 1])) e--;
    if (e - s >= 2) out.push({ id: out.length, start: s, end: e, text: doc.slice(s, e) });
  };
  for (let i = 0; i < doc.length; i++) {
    const ch = doc[i];
    if (ch === "\n") {
      // A line break ends a sentence when the next line is blank, a bullet, or the line is short (a heading / header line).
      const lineStart = doc.lastIndexOf("\n", i - 1) + 1;
      const line = doc.slice(lineStart, i).trim();
      const next = doc.slice(i + 1, doc.indexOf("\n", i + 1) === -1 ? doc.length : doc.indexOf("\n", i + 1)).trim();
      const isBreak = next === "" || /^([-*•▪]|\d+[.)]|[a-z][.)])\s/i.test(next) || line.length < 60 || /[.:;!?]$/.test(line);
      if (isBreak) {
        push(start, i);
        start = i + 1;
      }
      continue;
    }
    if (ch === "." || ch === "!" || ch === "?") {
      const nextCh = doc[i + 1];
      if (nextCh !== undefined && !/\s/.test(nextCh) && !/["')\]]/.test(nextCh)) continue;
      const before = doc.slice(Math.max(0, i - 8), i + 1);
      if (ch === "." && ABBR.test(before)) continue;
      if (ch === "." && /\d\.$/.test(before) && /\d/.test(doc[i + 1] ?? "")) continue;
      let e = i + 1;
      while (e < doc.length && /["')\]]/.test(doc[e])) e++;
      push(start, e);
      start = e;
    }
  }
  push(start, doc.length);
  return out;
}

// Words that move the starting point of a deadline. "90 days from today" and
// "90 days from the date of this notice" share the same number but not the same date.
const TIME_ANCHORS = /\b(today|today's|tonight|tomorrow|yesterday|from now|right now|this (week|month|year)|next (week|month|year)|last (week|month|year)|immediately|right away|already)\b/gi;

/** Time-anchor words in `text` that do not appear in `source`. */
export function newTimeAnchors(text: string, source: string): string[] {
  const src = source.toLowerCase();
  return [...new Set((text.match(TIME_ANCHORS) ?? []).map((w) => w.toLowerCase()))].filter((w) => !src.includes(w));
}

// Words that say something has already happened. "We ended your coverage" is not
// "Your coverage will end": the first tells a family it is too late.
const DONE_WORDS = /\b(ended|stopped|terminated|canceled|cancelled|closed|denied|discontinued|cut off|took away|removed|lost)\b/gi;

/** Already-happened words in `text` that do not appear in `source`. */
export function newDoneWords(text: string, source: string): string[] {
  const src = source.toLowerCase();
  return [...new Set((text.match(DONE_WORDS) ?? []).map((w) => w.toLowerCase()))].filter((w) => !src.includes(w));
}

/** Tokens a model-written sentence must not introduce: digits, money, dates, CFR cites. */
export function factTokens(s: string): string[] {
  const toks = new Set<string>();
  for (const m of s.matchAll(/\$?\d[\d,.:/-]*/g)) toks.add(m[0].replace(/[.,]+$/, "").replace(/,/g, ""));
  return [...toks].filter((t) => t.length > 0);
}
