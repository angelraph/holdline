// Nebius Token Factory client (OpenAI-compatible) and model-role resolution.
import OpenAI from "openai";
import type { ZodType } from "zod";

export type Role = "vision" | "fast" | "compose" | "reason";

export const ROLE_WHY: Record<Role, string> = {
  vision: "Vision-language Nemotron reads photos and scans verbatim.",
  fast: "Small, fast Nemotron for narrow labeling and translation. Cheap, low latency.",
  compose: "Mid-size Nemotron writes the plain-language summary, anchored to sentence IDs.",
  reason: "Nemotron 3 Ultra runs once, on the hard part: letter vs. regulation.",
};

// Used only when MODEL_* env vars are unset and /v1/models cannot be reached.
const DEFAULTS: Record<Role, string> = {
  vision: "nvidia/Nemotron-3.5-Super-VL",
  fast: "nvidia/Nemotron-3-Nano-30B-A3B",
  compose: "nvidia/nemotron-3-super-120b-a12b",
  reason: "nvidia/Nemotron-3-Ultra-550b-a55b",
};

// Estimated $ per 1M tokens [input, output]; shown as "est." in the run log.
const PRICE: [RegExp, number, number][] = [
  [/ultra/i, 1.0, 3.0],
  [/super.*vl|vl.*super/i, 0.3, 0.9],
  [/super/i, 0.3, 0.9],
  [/omni/i, 0.1, 0.4],
  [/nano/i, 0.06, 0.24],
];

export function estimateCost(model: string, tin: number, tout: number): number {
  const p = PRICE.find(([re]) => re.test(model));
  if (!p) return 0;
  return (tin * p[1] + tout * p[2]) / 1_000_000;
}

export function baseURL() {
  return process.env.NEBIUS_BASE_URL || "https://api.tokenfactory.nebius.com/v1";
}

export function hasNebius(key?: string) {
  return !!(key || process.env.NEBIUS_API_KEY);
}

export function client(key?: string) {
  return new OpenAI({ apiKey: key || process.env.NEBIUS_API_KEY, baseURL: baseURL(), timeout: 120_000, maxRetries: 1 });
}

let modelCache: { at: number; ids: string[] } | null = null;

export async function listModels(key?: string): Promise<string[]> {
  if (modelCache && Date.now() - modelCache.at < 10 * 60_000) return modelCache.ids;
  const res = await client(key).models.list();
  const ids = res.data.map((m) => m.id);
  modelCache = { at: Date.now(), ids };
  return ids;
}

function pick(ids: string[], role: Role): string | undefined {
  const nv = ids.filter((id) => /nemotron/i.test(id));
  const by = (re: RegExp, not?: RegExp) => nv.find((id) => re.test(id) && !(not && not.test(id)));
  switch (role) {
    case "vision":
      return by(/super.*vl|vl/i) ?? by(/omni/i);
    case "reason":
      return by(/3.*ultra|ultra/i);
    case "compose":
      return by(/3.*super|super/i, /vl/i) ?? by(/ultra/i);
    case "fast":
      return by(/3.*nano|nano/i, /vl|omni/i) ?? by(/nano/i) ?? by(/super/i, /vl/i);
  }
}

const ENV: Record<Role, string> = { vision: "MODEL_VISION", fast: "MODEL_FAST", compose: "MODEL_COMPOSE", reason: "MODEL_REASON" };

export async function resolveModel(role: Role, key?: string): Promise<string> {
  const fromEnv = process.env[ENV[role]];
  if (fromEnv) return fromEnv;
  try {
    return pick(await listModels(key), role) ?? DEFAULTS[role];
  } catch {
    return DEFAULTS[role];
  }
}

export type ModelCall<T> = { data: T; model: string; ms: number; tokensIn: number; tokensOut: number; costUsd: number };

function stripThinking(s: string) {
  return s.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^[\s\S]*?<\/think>/i, "").trim();
}

function parseJsonLoose(s: string): unknown {
  const t = stripThinking(s).replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(t);
  } catch {
    const a = t.indexOf("{");
    const b = t.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw new Error("Model did not return JSON");
  }
}

/** One JSON-returning chat call, validated with zod, retried once on bad output. */
export async function chatJSON<T>(opts: {
  role: Role;
  system: string;
  user: string | OpenAI.Chat.Completions.ChatCompletionContentPart[];
  schema: ZodType<T>;
  key?: string;
  maxTokens?: number;
  think?: boolean; // false turns off Nemotron reasoning for simple tasks (≈3x faster)
  jsonMode?: boolean; // false skips response_format; JSON mode drops apostrophes and hyphens from Nemotron 3 Super prose
}): Promise<ModelCall<T>> {
  const model = await resolveModel(opts.role, opts.key);
  const c = client(opts.key);
  const t0 = Date.now();
  let tin = 0, tout = 0;
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];
  let lastErr: unknown;
  let useFormat = opts.jsonMode !== false;
  let useThinkFlag = opts.think === false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await c.chat.completions.create({
        model,
        messages,
        temperature: 0,
        max_tokens: opts.maxTokens ?? 2000,
        ...(useFormat ? { response_format: { type: "json_object" as const } } : {}),
        ...(useThinkFlag ? { chat_template_kwargs: { enable_thinking: false } } : {}),
      } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);
      tin += res.usage?.prompt_tokens ?? 0;
      tout += res.usage?.completion_tokens ?? 0;
      const content = res.choices[0]?.message?.content ?? "";
      const parsed = opts.schema.safeParse(parseJsonLoose(content));
      if (parsed.success) {
        return { data: parsed.data, model, ms: Date.now() - t0, tokensIn: tin, tokensOut: tout, costUsd: estimateCost(model, tin, tout) };
      }
      lastErr = parsed.error;
      messages.push({ role: "assistant", content }, { role: "user", content: `That JSON did not match the schema: ${parsed.error.message.slice(0, 500)}. Reply with corrected JSON only.` });
    } catch (e: unknown) {
      lastErr = e;
      const status = (e as { status?: number }).status;
      if (status === 400 && (useFormat || useThinkFlag)) {
        // some endpoints reject response_format or chat_template_kwargs; retry without them
        if (useThinkFlag) useThinkFlag = false;
        else useFormat = false;
        continue;
      }
      if (status === 401 || status === 403 || status === 404) break;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** Plain-text call (used for verbatim OCR). */
export async function chatText(opts: {
  role: Role;
  system: string;
  user: OpenAI.Chat.Completions.ChatCompletionContentPart[] | string;
  key?: string;
  maxTokens?: number;
}): Promise<ModelCall<string>> {
  const model = await resolveModel(opts.role, opts.key);
  const t0 = Date.now();
  const res = await client(opts.key).chat.completions.create({
    model,
    temperature: 0,
    max_tokens: opts.maxTokens ?? 6000,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  });
  const tin = res.usage?.prompt_tokens ?? 0;
  const tout = res.usage?.completion_tokens ?? 0;
  return {
    data: stripThinking(res.choices[0]?.message?.content ?? ""),
    model,
    ms: Date.now() - t0,
    tokensIn: tin,
    tokensOut: tout,
    costUsd: estimateCost(model, tin, tout),
  };
}
