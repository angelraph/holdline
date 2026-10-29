import { hasNebius, resolveModel } from "@/lib/nebius";
import { hasTavily } from "@/lib/tavily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const nebius = hasNebius();
  const models = nebius
    ? {
        vision: await resolveModel("vision"),
        fast: await resolveModel("fast"),
        compose: await resolveModel("compose"),
        reason: await resolveModel("reason"),
      }
    : null;
  return Response.json({ nebius, tavily: hasTavily(), models });
}
