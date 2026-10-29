// The reply letter is assembled from fixed template sentences, verified quotes, and
// blanks. No model writes any part of it.
import type { RulePack } from "@/rulepacks/types";
import type { ClockItem, ElementResult } from "./types";
import type { Sentence } from "./spans";
import { formatLong } from "./dates";

export function buildReply(opts: {
  pack: RulePack;
  elements: ElementResult[];
  sentences: Sentence[];
  noticeDateText?: string;
  keep?: ClockItem;
}): string {
  const { pack, elements, sentences, keep } = opts;
  const fill = (s: string) => (opts.noticeDateText ? s.replaceAll("[NOTICE DATE]", opts.noticeDateText) : s);
  const lines: string[] = [];
  lines.push("[DATE]", "", `To: [NAME OF ${pack.senderNoun.toUpperCase()} CONTACT]`, `Re: ${fill(pack.reply.subject)}`, "");
  lines.push(fill(pack.reply.opening));

  const action = elements.find((e) => e.id === "action" && e.status !== "missing");
  const actionSentence = action ? sentences.find((s) => s.id === action.sentenceIds[0]) : undefined;
  if (actionSentence) lines.push("", `The notice states: "${actionSentence.text}"`);

  lines.push("", pack.reply.disagree);
  lines.push(pack.reply.keepIt);
  if (keep) lines.push(`I am sending this request before ${formatLong(keep.iso)}.`);

  const missing = elements.filter((e) => e.status === "missing" && !e.optional);
  const partial = elements.filter((e) => e.status === "partial");
  if (missing.length || partial.length) {
    lines.push("", "The notice does not fully include information that federal rules require it to contain. Please provide, in writing:");
    for (const e of [...missing, ...partial]) lines.push(`  • ${e.ask} (${e.cite})${e.status === "partial" ? " — the notice addresses this only in part" : ""}`);
  }

  lines.push("", pack.reply.closing, "", "Sincerely,", "[YOUR NAME]");
  return lines.join("\n");
}
