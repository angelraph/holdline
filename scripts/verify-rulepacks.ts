// Checks every `sourceQuote` in every rule pack against the live eCFR text and
// refreshes the offline snapshots. Exits non-zero on any drift.
import { PACKS } from "../rulepacks";
import { fetchEcfrSection, writeSnapshot } from "../lib/ecfr";
import { contains } from "../lib/spans";

async function main() {
  let failures = 0;
  const seen = new Map<string, string>();
  for (const pack of PACKS) {
    for (const src of pack.sources) {
      if (seen.has(src.id)) continue;
      const { text, asOf } = await fetchEcfrSection(src);
      seen.set(src.id, text);
      writeSnapshot(src, text, asOf);
      console.log(`fetched ${src.cite} (eCFR as of ${asOf}, ${text.length} chars)`);
    }
    const quotes = [
      ...pack.elements.map((e) => ({ where: `${pack.id}/${e.id}`, sourceId: e.sourceId, q: e.sourceQuote })),
      ...pack.clock.map((c) => ({ where: `${pack.id}/clock:${c.id}`, sourceId: c.sourceId, q: c.sourceQuote })),
      ...(pack.plainLanguage ? [{ where: `${pack.id}/plainLanguage`, sourceId: pack.plainLanguage.sourceId, q: pack.plainLanguage.sourceQuote }] : []),
      ...(pack.hearingWindowDays
        ? [{ where: `${pack.id}/hearingWindow`, sourceId: pack.hearingWindowDays.sourceId, q: pack.hearingWindowDays.sourceQuote }]
        : []),
    ];
    for (const { where, sourceId, q } of quotes) {
      const text = seen.get(sourceId);
      const ok = !!text && contains(text, q);
      if (!ok) failures++;
      console.log(`${ok ? "  ok " : "  FAIL"} ${where}`);
    }
  }
  if (failures) {
    console.error(`\n${failures} quote(s) no longer match the regulation text.`);
    process.exit(1);
  }
  console.log("\nAll rule-pack quotes match live eCFR text.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
