import fs from "node:fs";
import path from "node:path";
import type { RegSource } from "@/rulepacks/types";

const API = "https://www.ecfr.gov/api/versioner/v1";

export function xmlToText(xml: string): string {
  return xml
    .replace(/<\/(P|HEAD|FP|CITA|AUTH|SECAUTH)>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&#167;|&sect;/g, "§")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

const TTL = 6 * 60 * 60 * 1000;
let datesCache: Record<number, string> | null = null;
let datesAt = 0;

async function latestDate(title: number): Promise<string> {
  if (!datesCache || Date.now() - datesAt > TTL) {
    const r = await fetch(`${API}/titles.json`, { headers: { "accept-encoding": "gzip" } });
    if (!r.ok) throw new Error(`eCFR titles ${r.status}`);
    const j = (await r.json()) as { titles: { number: number; up_to_date_as_of: string }[] };
    datesAt = Date.now();
    datesCache = Object.fromEntries(j.titles.map((t) => [t.number, t.up_to_date_as_of]));
  }
  const d = datesCache[title];
  if (!d) throw new Error(`eCFR has no date for title ${title}`);
  return d;
}

const sectionCache = new Map<string, { at: number; v: { text: string; asOf: string } }>();

/** Live section text from the official eCFR versioner API (cached 6h per process). */
export async function fetchEcfrSection(src: RegSource): Promise<{ text: string; asOf: string }> {
  const hit = sectionCache.get(src.id);
  if (hit && Date.now() - hit.at < TTL) return hit.v;
  const asOf = await latestDate(src.ecfr.title);
  const url = `${API}/full/${asOf}/title-${src.ecfr.title}.xml?part=${src.ecfr.part}&section=${src.ecfr.section}`;
  const r = await fetch(url, { headers: { "accept-encoding": "gzip" } });
  if (!r.ok) throw new Error(`eCFR ${src.cite} ${r.status}`);
  const v = { text: xmlToText(await r.text()), asOf };
  sectionCache.set(src.id, { at: Date.now(), v });
  return v;
}

export type SectionStatus = { status: "exists" | "reserved" | "missing"; heading?: string } | null;

const statusCache = new Map<string, SectionStatus>();

/** Does a CFR section exist and have content? Used to catch made-up citations in a letter. */
export async function ecfrSectionStatus(title: number, section: string): Promise<SectionStatus> {
  const k = `${title}-${section}`;
  if (statusCache.has(k)) return statusCache.get(k)!;
  const v = await ecfrSectionStatusUncached(title, section);
  if (v) statusCache.set(k, v);
  return v;
}

async function ecfrSectionStatusUncached(title: number, section: string): Promise<SectionStatus> {
  try {
    const asOf = await latestDate(title);
    const part = section.split(".")[0];
    const r = await fetch(`${API}/full/${asOf}/title-${title}.xml?part=${part}&section=${section}`, {
      headers: { "accept-encoding": "gzip" },
    });
    const t = await r.text();
    if (!r.ok || t.includes("No matching content")) return r.status >= 500 ? null : { status: "missing" };
    const heading = xmlToText(/<HEAD>([\s\S]*?)<\/HEAD>/.exec(t)?.[1] ?? "");
    if (/\[Reserved\]/i.test(heading)) return { status: "reserved", heading };
    return { status: "exists", heading };
  } catch {
    return null;
  }
}

const SNAP_DIR = path.join(process.cwd(), "rulepacks", "snapshots");

export function snapshotPath(src: RegSource) {
  return path.join(SNAP_DIR, `${src.id}.txt`);
}

export function readSnapshot(src: RegSource): { text: string; asOf: string } | null {
  try {
    const raw = fs.readFileSync(snapshotPath(src), "utf8");
    const nl = raw.indexOf("\n");
    return { asOf: raw.slice(0, nl).replace(/^as-of:\s*/, ""), text: raw.slice(nl + 1) };
  } catch {
    return null;
  }
}

export function writeSnapshot(src: RegSource, text: string, asOf: string) {
  fs.mkdirSync(SNAP_DIR, { recursive: true });
  fs.writeFileSync(snapshotPath(src), `as-of: ${asOf}\n${text}`, "utf8");
}
