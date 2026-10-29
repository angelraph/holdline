// npm run models — lists the Nemotron models your Token Factory key can use and which
// one Holdline picks for each role.
import "dotenv/config";
import { hasNebius, listModels, resolveModel, type Role } from "../lib/nebius";

async function main() {
  if (!hasNebius()) {
    console.error("Set NEBIUS_API_KEY in .env first (see GET-KEYS.md).");
    process.exit(1);
  }
  const ids = await listModels();
  console.log(`${ids.length} models on Token Factory. NVIDIA ones:`);
  for (const id of ids.filter((i) => /nvidia|nemotron/i.test(i))) console.log(`  ${id}`);
  console.log("\nHoldline roles:");
  for (const r of ["vision", "fast", "compose", "reason"] as Role[]) console.log(`  ${r.padEnd(8)} → ${await resolveModel(r)}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
