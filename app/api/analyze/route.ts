import { runPipeline } from "@/lib/pipeline";
import { hasNebius } from "@/lib/nebius";
import { recordedFor } from "@/lib/recorded";
import type { AnalyzeInput, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_BYTES = 12 * 1024 * 1024;

// Streams NDJSON: one StreamEvent per line. Nothing is stored.
export async function POST(req: Request) {
  let input: AnalyzeInput;
  try {
    input = (await req.json()) as AnalyzeInput;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (input.file && input.file.base64.length * 0.75 > MAX_BYTES) {
    return Response.json({ error: "File is larger than 12 MB" }, { status: 413 });
  }
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      try {
        const recorded = !hasNebius(input.nebiusKey) ? recordedFor(input) : null;
        if (recorded) {
          for (const step of recorded.steps) send({ type: "step", step });
          send({ type: "result", audit: recorded });
          return;
        }
        const audit = await runPipeline(input, send);
        send({ type: "result", audit });
      } catch (e) {
        send({ type: "error", message: (e as Error).message || "Something went wrong" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}
