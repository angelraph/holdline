// npm run record — runs each sample live (Nemotron + Tavily) and saves the result to
// samples/recorded/<id>.json. The app replays these, clearly labelled, only when no
// Nebius key is configured, so the hosted demo still shows a real model run.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { runPipeline } from "../lib/pipeline";
import { hasNebius } from "../lib/nebius";
import { SAMPLES } from "../samples";

async function main() {
  if (!hasNebius()) {
    console.error("Recording needs NEBIUS_API_KEY (and ideally TAVILY_API_KEY) in .env.");
    process.exit(1);
  }
  const dir = path.join(process.cwd(), "samples", "recorded");
  fs.mkdirSync(dir, { recursive: true });
  for (const s of SAMPLES) {
    process.stdout.write(`recording ${s.id}… `);
    const audit = await runPipeline({ text: s.text, packId: s.packId, state: s.state, lang: "en" }, () => {});
    fs.writeFileSync(path.join(dir, `${s.id}.json`), JSON.stringify({ ...audit, runMode: "recorded", recordedAt: new Date().toISOString() }));
    console.log(`${audit.steps.filter((x) => x.model).length} model calls, ${audit.elements.filter((e) => e.status !== "found").length} gaps`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
