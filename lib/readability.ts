// Flesch–Kincaid grade level. Deterministic; same letter, same number.

function syllables(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const m = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}

export type Readability = { grade: number; words: number; sentences: number; longestSentenceWords: number };

export function readability(text: string): Readability {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => /[a-z]/i.test(s));
  const words = text.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  const nS = Math.max(1, sentences.length);
  const nW = Math.max(1, words.length);
  const grade = 0.39 * (nW / nS) + 11.8 * (syl / nW) - 15.59;
  const longest = sentences.reduce((m, s) => Math.max(m, (s.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).length), 0);
  return { grade: Math.max(0, Math.round(grade * 10) / 10), words: words.length, sentences: sentences.length, longestSentenceWords: longest };
}
