import { ideaPwn } from "./idea-pwn";
import { medicaidAdverse } from "./medicaid-adverse";
import { snapAdverse } from "./snap-adverse";
import type { RulePack } from "./types";

export const PACKS: RulePack[] = [ideaPwn, medicaidAdverse, snapAdverse];

export function getPack(id: string): RulePack | undefined {
  return PACKS.find((p) => p.id === id);
}

/** Offline notice-type guess: the pack whose detect patterns match the most. */
export function detectPack(text: string): RulePack {
  let best = PACKS[0];
  let bestScore = -1;
  for (const p of PACKS) {
    const score = p.detect.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

export { STATE_ABBR } from "./idea-pwn";
export type * from "./types";
