// Find legal citations printed in the letter, so each one can be checked.

export type FoundCitation = {
  text: string;
  start: number;
  end: number;
  kind: "cfr" | "usc" | "other";
  title?: number;
  section?: string;
};

const CFR = /\b(\d{1,2})\s*C\.?\s?F\.?\s?R\.?\s*(?:§+\s*|Part\s+|Sec(?:tion|\.)?\s*)?(\d{1,4}\.\d{1,4}[a-z]?)(\s*\([a-z0-9]{1,4}\))*/gi;
const USC = /\b(\d{1,2})\s*U\.?\s?S\.?\s?C\.?\s*(?:§+\s*|Sec(?:tion|\.)?\s*)?(\d{1,5}[a-z]?)(\s*\([a-z0-9]{1,4}\))*/gi;
const OTHER =
  /\b((?:Board|District|Administrative)\s+(?:Policy|Regulation|Procedure)\s+(?:No\.\s*)?[\dA-Z][\w.-]*|(?:[A-Z][a-z]+\s+){0,2}(?:Education|Welfare(?: and Institutions)?|Administrative|Health and Safety)\s+Code\s+(?:Section\s+|§\s*)?[\d.]+[a-z]?|Policy\s+Manual\s+(?:Section\s+)?[\d.]+)/g;

export function findCitations(doc: string): FoundCitation[] {
  const out: FoundCitation[] = [];
  const taken: [number, number][] = [];
  const overlaps = (s: number, e: number) => taken.some(([a, b]) => s < b && e > a);
  for (const m of doc.matchAll(CFR)) {
    const s = m.index!, e = s + m[0].length;
    if (overlaps(s, e)) continue;
    taken.push([s, e]);
    out.push({ text: m[0], start: s, end: e, kind: "cfr", title: Number(m[1]), section: m[2] });
  }
  for (const m of doc.matchAll(USC)) {
    const s = m.index!, e = s + m[0].length;
    if (overlaps(s, e)) continue;
    taken.push([s, e]);
    out.push({ text: m[0], start: s, end: e, kind: "usc", title: Number(m[1]), section: m[2] });
  }
  for (const m of doc.matchAll(OTHER)) {
    const s = m.index!, e = s + m[0].length;
    if (overlaps(s, e)) continue;
    taken.push([s, e]);
    out.push({ text: m[0].trim(), start: s, end: s + m[0].trim().length, kind: "other" });
  }
  return out.sort((a, b) => a.start - b.start);
}
