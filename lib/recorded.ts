import fs from "node:fs";
import path from "node:path";
import { SAMPLES } from "@/samples";
import { daysUntil, fromIso, toIso } from "./dates";
import type { AnalyzeInput, Audit } from "./types";

/**
 * When no Nebius key is configured, a sample letter replays its recorded live run
 * (labelled as such in the UI). Days-left are recomputed for today.
 */
export function recordedFor(input: AnalyzeInput): Audit | null {
  if (input.file || !input.text) return null;
  if (input.lang && input.lang !== "en") return null;
  const s = SAMPLES.find((x) => x.text.trim() === input.text!.trim());
  if (!s) return null;
  const f = path.join(process.cwd(), "samples", "recorded", `${s.id}.json`);
  if (!fs.existsSync(f)) return null;
  const a = JSON.parse(fs.readFileSync(f, "utf8")) as Audit;
  const today = input.today ?? toIso(new Date());
  const t = fromIso(today);
  const fix = <T extends { iso: string; daysLeft: number }>(i: T) => ({ ...i, daysLeft: daysUntil(i.iso, t) });
  a.clock.items = a.clock.items.map(fix);
  if (a.clock.primary) a.clock.primary = fix(a.clock.primary);
  a.today = today;
  a.mode = input.mode ?? "receive";
  if (a.mode === "send") a.reply = "";
  return a;
}
