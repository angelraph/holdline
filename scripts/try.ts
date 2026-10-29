import "dotenv/config";
import { runPipeline } from "../lib/pipeline";
import { SAMPLES } from "../samples";

async function main() {
  const only = process.argv[2];
  for (const s of SAMPLES.filter((x) => !only || x.id === only)) {
    const a = await runPipeline({ text: s.text, packId: "auto", state: s.state, today: "2026-10-29", lang: process.argv[3] }, (e) => {
      if (e.type === "step") console.log(`  [${e.step.status}] ${e.step.label} ${e.step.model ?? ""} ${(e.step.ms / 1000).toFixed(1)}s ${e.step.detail ?? ""}`);
    });
    console.log(`\n=== ${s.id} → ${a.packId} (${a.runMode}) grade ${a.readability.grade}`);
    console.log("dates:", a.dates.map((d) => `${d.text}=${d.iso}:${d.role}`).join(" | "));
    for (const i of a.clock.items) console.log(`  clock ${i.kind} ${i.iso} (${i.daysLeft}d) ${i.label}`);
    if (a.clock.unreadable) console.log("  UNREADABLE:", a.clock.unreadableReason);
    for (const e of a.elements) console.log(`  ${e.status.padEnd(7)} ${e.cite} ${e.label} ${e.sentenceIds.join(",")}`);
    for (const c of a.citations) console.log(`  cite ${c.status} ${c.text} — ${c.note ?? ""}`);
    for (const b of a.summary) console.log(`  • ${b.text} [${b.sentenceIds}]`);
    if (a.translation) console.log("  translation:", a.translation.bullets.join(" | "));
    for (const g of a.help) console.log(`  help ${g.label}: ${g.results.map((r) => r.url).join(" , ")}`);
    console.log("  sources:", a.sources.map((x) => `${x.cite}:${x.via}`).join(", "));
    console.log("  verifier:", JSON.stringify(a.verifier));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
