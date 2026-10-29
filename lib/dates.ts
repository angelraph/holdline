// Deterministic date engine. Models may label dates found here; they never produce one.
import * as chrono from "chrono-node";
import type { DateRole } from "@/rulepacks/types";
import type { Span } from "./spans";

export type DateCandidate = Span & {
  id: string; // "d0", "d1", ...
  iso: string; // YYYY-MM-DD
  yearInferred: boolean;
  context: string; // the surrounding sentence, for labeling
};

export type RelativeDeadline = Span & {
  id: string; // "r0"...
  count: number;
  unit: "calendar" | "business" | "school";
  anchor: "notice" | "receipt";
  context: string;
};

export type ComputedDate = {
  iso: string;
  steps: string[]; // the math, shown to the user
  conservative: boolean; // true when the real date may be later (school days, receipt date)
};

const WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
  twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, twenty: 20, thirty: 30, forty: 40, "forty-five": 45,
  sixty: 60, ninety: 90,
};

function sentenceAround(doc: string, start: number, end: number): string {
  let s = start;
  while (s > 0 && !/[.!?\n]/.test(doc[s - 1])) s--;
  let e = end;
  while (e < doc.length && !/[.!?\n]/.test(doc[e])) e++;
  return doc.slice(s, Math.min(doc.length, e + 1)).trim();
}

export function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function formatLong(iso: string): string {
  return fromIso(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

const ABSOLUTE = /\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}|\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;

/** All absolute calendar dates printed in the letter, with exact offsets. */
export function findDates(doc: string, ref = new Date()): DateCandidate[] {
  const results = chrono.en.strict.parse(doc, ref);
  const out: DateCandidate[] = [];
  for (const r of results) {
    if (!r.start.isCertain("day") || !r.start.isCertain("month")) continue;
    if (!ABSOLUTE.test(r.text)) continue; // only dates printed on the page, never "within 10 days" or "tomorrow"
    const yearInferred = !r.start.isCertain("year");
    const d = r.start.date();
    const start = r.index;
    const end = r.index + r.text.length;
    out.push({
      id: `d${out.length}`,
      start,
      end,
      text: doc.slice(start, end),
      iso: toIso(d),
      yearInferred,
      context: sentenceAround(doc, start, end),
    });
  }
  return out;
}

const REL =
  /within\s+(\d{1,3}|[a-z-]+)(?:\s*\(\s*\d{1,3}\s*\))?\s+(calendar\s+|business\s+|working\s+|school\s+)?days?\s+(?:of|from|after)\s+(?:the\s+)?(date\s+(?:of\s+)?(?:this|the)\s+(?:notice|letter)|date\s+(?:this|the)\s+(?:notice|letter)\s+(?:was|is)\s+(?:mailed|sent|dated|issued)|(?:notice\s+)?mailing\s+date|date\s+(?:on|at\s+the\s+top\s+of)\s+(?:this|the)\s+(?:notice|letter)|date\s+(?:you|that\s+you)\s+(?:receive|received|get)\s+(?:this|the)\s+(?:notice|letter)|receipt(?:\s+of\s+(?:this|the)\s+(?:notice|letter))?)/gi;

/** Relative deadlines such as "within 10 days of the date of this notice". */
export function findRelativeDeadlines(doc: string): RelativeDeadline[] {
  const out: RelativeDeadline[] = [];
  for (const m of doc.matchAll(REL)) {
    const raw = m[1].toLowerCase();
    const count = /^\d+$/.test(raw) ? Number(raw) : WORDS[raw];
    if (!count) continue;
    const u = (m[2] ?? "").trim().toLowerCase();
    const unit: RelativeDeadline["unit"] = u === "business" || u === "working" ? "business" : u === "school" ? "school" : "calendar";
    const anchor: RelativeDeadline["anchor"] = /receiv|receipt|get/i.test(m[3]) ? "receipt" : "notice";
    const start = m.index!;
    const end = start + m[0].length;
    out.push({ id: `r${out.length}`, start, end, text: doc.slice(start, end), count, unit, anchor, context: sentenceAround(doc, start, end) });
  }
  return out;
}

export function addDays(iso: string, n: number): string {
  const d = fromIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

export function addBusinessDays(iso: string, n: number): string {
  const d = fromIso(iso);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return toIso(d);
}

export function computeRelative(rel: RelativeDeadline, noticeIso: string, noticeText: string): ComputedDate {
  const steps: string[] = [];
  steps.push(`The letter says: "${rel.text}".`);
  steps.push(`The letter is dated "${noticeText}" (${formatLong(noticeIso)}).`);
  let iso: string;
  let conservative = false;
  if (rel.unit === "calendar") {
    iso = addDays(noticeIso, rel.count);
    steps.push(`${formatLong(noticeIso)} + ${rel.count} calendar days = ${formatLong(iso)}.`);
  } else {
    iso = addBusinessDays(noticeIso, rel.count);
    steps.push(`${formatLong(noticeIso)} + ${rel.count} weekdays (Saturdays and Sundays skipped) = ${formatLong(iso)}.`);
    steps.push("Holidays are not skipped, so this is the earliest the deadline could be — the safe date to use.");
    conservative = true;
    if (rel.unit === "school") {
      steps.push("The letter counts school days. School breaks can push the real deadline later; this date is the earliest possible.");
    }
  }
  if (rel.anchor === "receipt") {
    steps.push("The letter counts from the day you received it. This uses the letter date, which is the earliest possible start — the safe choice.");
    conservative = true;
  }
  return { iso, steps, conservative };
}

/** Whole days from today to `iso` (negative when past). */
export function daysUntil(iso: string, today = new Date()): number {
  const a = fromIso(toIso(today)).getTime();
  const b = fromIso(iso).getTime();
  return Math.round((b - a) / 86_400_000);
}

const ACT = /\b(request|ask|appeal|file|submit|respond|reply|return|send|call|contact|sign|apply)\b/i;
const KEEP = /\b(keep|continu\w*|remain|stay|maintain)\b/i;
const CHANGE = /\b(effective|takes? effect|begin\w*|start\w*|end\w*|stop\w*|terminat\w*|reduc\w*|implement\w*|chang\w*|discontinu\w*|close\w*|cancel\w*)\b/i;

/**
 * Check a model's role label against the words around the date. Returns the role to use
 * (possibly corrected) and whether the model's label was overruled.
 */
export function checkRole(model: DateRole, c: DateCandidate, doc: string): { role: DateRole; overruled: boolean } {
  const ctx = c.context;
  // A response deadline whose sentence is about keeping services is the keep-by deadline.
  if (model === "respond_by" && KEEP.test(ctx) && ACT.test(ctx)) return { role: "keep_by", overruled: true };
  if ((model === "keep_by" || model === "respond_by") && !ACT.test(ctx)) {
    return { role: guessRole(c, doc), overruled: true };
  }
  if (model === "effective" && !CHANGE.test(ctx)) return { role: guessRole(c, doc), overruled: true };
  return { role: model, overruled: false };
}

/** Offline role labeling: keywords in the sentence around each date. */
export function guessRole(c: DateCandidate, doc: string): DateRole {
  const ctx = c.context.toLowerCase();
  const lineStart = doc.lastIndexOf("\n", c.start - 1) + 1;
  const linePrefix = doc.slice(lineStart, c.start).toLowerCase();
  if (/\b(date|dated|notice date|date of notice|mailed|date mailed)\s*:?\s*$/.test(linePrefix)) return "notice_date";
  if (/(continu|keep (getting|receiving|your))/.test(ctx) && /(by|before|no later than|on or before|within)/.test(ctx)) return "keep_by";
  if (/(request|ask for|file|submit|send|respond|appeal).{0,60}(by|before|no later than|on or before)/.test(ctx)) return "respond_by";
  if (/(meeting|conference)/.test(ctx) && /(scheduled|will be held|invite|on)/.test(ctx)) return "meeting";
  if (/(effective|takes? effect|beginning|begin|starting|start|will (end|stop|be reduced|change|close|terminate|be implemented)|implemented|terminat|discontinu|last day|ends? on|reduc)/.test(ctx))
    return "effective";
  if (c.start < 400) return "notice_date";
  return "other";
}
