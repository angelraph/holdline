// npm run eval: runs every labelled case through the real pipeline and scores it.
// The invariants (0 ungrounded statements shipped, 0 off-allowlist URLs) are re-checked
// here independently of the pipeline's own guards.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { runPipeline } from "../lib/pipeline";
import { factTokens, newDoneWords, newTimeAnchors } from "../lib/spans";
import { getPack } from "../rulepacks";
import { hostAllowed } from "../lib/tavily";
import { CASES } from "../evals/cases";

const TODAY = "2026-10-28";

async function main() {
  const rows: string[] = [];
  let deadlineOk = 0, packOk = 0;
  let elTotal = 0, elOk = 0, missTotal = 0, missCaught = 0;
  let badTotal = 0, badCaught = 0;
  let ungrounded = 0, offAllow = 0, blocked = 0;
  let cost = 0, ms = 0;
  let mode = "";

  for (const c of CASES) {
    const t0 = Date.now();
    const a = await runPipeline({ text: c.text, packId: "auto", today: TODAY }, () => {});
    ms += Date.now() - t0;
    mode = a.runMode;
    cost += a.steps.reduce((n, s) => n + (s.costUsd ?? 0), 0);
    blocked += a.verifier.modelLabelsRejected + a.verifier.elementClaimsRejected + a.verifier.summaryDropped + a.verifier.translationDropped;

    const pOk = a.packId === c.packId;
    if (pOk) packOk++;

    let dOk: boolean;
    if (c.primary === "unreadable") dOk = a.clock.unreadable;
    else dOk = !a.clock.unreadable && a.clock.primary?.iso === c.primary.iso && a.clock.primary?.kind === c.primary.kind;
    if (dOk) deadlineOk++;

    let caseEl = 0, caseElOk = 0;
    for (const [id, exp] of Object.entries(c.elements)) {
      if (exp === "any") continue;
      const got = a.elements.find((e) => e.id === id)?.status;
      const present = got === "found" || got === "partial";
      const ok = exp === "present" ? present : !present;
      caseEl++; elTotal++;
      if (ok) { caseElOk++; elOk++; }
      if (exp === "missing") { missTotal++; if (ok) missCaught++; }
    }

    for (const bad of c.badCitations ?? []) {
      badTotal++;
      if (a.citations.some((x) => x.text.includes(bad.split(" ").pop()!) && x.status === "not_found")) badCaught++;
    }

    // Independent re-check: every summary line cites real sentences and adds no new numbers.
    for (const b of a.summary) {
      const src = b.sentenceIds.map((i) => a.sentences[i]?.text ?? "").join(" ");
      if (!b.sentenceIds.length || b.sentenceIds.some((i) => !a.sentences[i]) || !factTokens(b.text).every((t) => src.includes(t) || factTokens(src).includes(t)) || newTimeAnchors(b.text, src).length || newDoneWords(b.text, src).length) ungrounded++;
    }
    // Every element marked present must point to real sentences.
    for (const e of a.elements) if (e.status !== "missing" && (!e.sentenceIds.length || e.sentenceIds.some((i) => !a.sentences[i]))) ungrounded++;
    // Every URL shown must be on the pack allowlist (or the state .gov list used for help).
    const pack = getPack(a.packId)!;
    for (const g of a.help) for (const r of g.results) {
      const doms = pack.help.find((h) => h.id === g.id)!.domains(a.state ?? "");
      if (!hostAllowed(r.url, doms)) offAllow++;
    }

    rows.push(`| ${c.id} | ${pOk ? "✓" : "✗"} | ${dOk ? "✓" : "✗"} ${a.clock.unreadable ? "unreadable" : `${a.clock.primary?.iso}`} | ${caseElOk}/${caseEl} |`);
  }

  const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(0)}%` : "n/a");
  const out = [
    `# Holdline eval: ${mode} mode, ${CASES.length} letters, today = ${TODAY}`,
    "",
    "| Letter | Notice type | Deadline | Required elements |",
    "|---|---|---|---|",
    ...rows,
    "",
    "| Metric | Result |",
    "|---|---|",
    `| Notice type detected | ${packOk}/${CASES.length} (${pct(packOk, CASES.length)}) |`,
    `| Deadline exact (or correctly "unreadable") | ${deadlineOk}/${CASES.length} (${pct(deadlineOk, CASES.length)}) |`,
    `| Required elements judged correctly | ${elOk}/${elTotal} (${pct(elOk, elTotal)}) |`,
    `| Missing elements caught | ${missCaught}/${missTotal} (${pct(missCaught, missTotal)}) |`,
    `| Bogus citations flagged | ${badCaught}/${badTotal} |`,
    `| **Ungrounded statements shipped** | **${ungrounded}** |`,
    `| **Off-allowlist URLs shown** | **${offAllow}** |`,
    `| AI statements blocked by the guards | ${blocked} |`,
    `| Avg time per letter | ${(ms / CASES.length / 1000).toFixed(1)}s |`,
    `| Est. model cost per letter | $${(cost / CASES.length).toFixed(4)} |`,
  ].join("\n");
  console.log(out);
  const dir = path.join(process.cwd(), "evals", "results");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${mode}.md`), out + "\n");
  if (ungrounded || offAllow) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
