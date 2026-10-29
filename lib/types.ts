import type { DateRole } from "@/rulepacks/types";
import type { Sentence } from "./spans";
import type { ComputedDate, DateCandidate, RelativeDeadline } from "./dates";
import type { Readability } from "./readability";

export type Mode = "receive" | "send"; // a family checking a letter, or a sender checking a draft

export type AnalyzeInput = {
  text?: string;
  file?: { name: string; mime: string; base64: string };
  packId?: string; // "auto" or a pack id
  state?: string;
  lang?: string; // "en", "es", ...
  mode?: Mode;
  today?: string; // ISO; lets evals and recorded runs pin "today"
  nebiusKey?: string; // optional user-supplied key, used for this request only
};

export type RunStep = {
  id: string;
  label: string;
  kind: "model" | "search" | "code";
  status: "ok" | "fallback" | "skipped" | "error";
  why: string;
  model?: string;
  ms: number;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  detail?: string;
  urls?: string[];
};

export type ClockItem = {
  kind: "keep" | "effective" | "respond" | "hearing_window" | "meeting";
  label: string;
  iso: string;
  daysLeft: number;
  span?: { start: number; end: number };
  steps?: string[];
  conservative?: boolean;
  rule?: { cite: string; quote: string; url: string; meaning: string; action: string };
};

export type ElementResult = {
  id: string;
  label: string;
  plain: string;
  cite: string;
  sourceQuote: string;
  sourceUrl: string;
  ask: string;
  status: "found" | "partial" | "missing";
  sentenceIds: number[];
  optional?: boolean;
};

export type CitationResult = {
  text: string;
  start: number;
  end: number;
  kind: "cfr" | "usc" | "other";
  status: "verified" | "not_found" | "unchecked";
  url?: string;
  via?: string;
  note?: string;
};

export type SourceUsed = { id: string; cite: string; url: string; via: "tavily" | "ecfr" | "snapshot"; asOf?: string; text?: string };

export type HelpGroup = { id: string; label: string; results: { title: string; url: string; snippet?: string }[] };

export type Bullet = { text: string; sentenceIds: number[] };

export type Audit = {
  runMode: "live" | "offline" | "recorded";
  recordedAt?: string;
  mode: Mode;
  packId: string;
  packName: string;
  packShort: string;
  docText: string;
  today: string;
  sentences: Sentence[];
  dates: (DateCandidate & { role: DateRole })[];
  relative: (RelativeDeadline & { computed?: ComputedDate })[];
  clock: { primary?: ClockItem; items: ClockItem[]; unreadable: boolean; unreadableReason?: string };
  elements: ElementResult[];
  citations: CitationResult[];
  sources: SourceUsed[];
  readability: Readability;
  plainLanguage?: { cite: string; quote: string };
  summary: Bullet[];
  translation?: { lang: string; bullets: string[]; clockAction?: string; clockMeaning?: string };
  state?: string;
  help: HelpGroup[];
  reply: string;
  verifier: {
    datesFound: number;
    modelLabelsRejected: number;
    elementClaimsRejected: number;
    summaryDropped: number;
    translationDropped: number;
    offAllowlistRejected: number;
  };
  steps: RunStep[];
};

export type StreamEvent =
  | { type: "step"; step: RunStep }
  | { type: "status"; message: string }
  | { type: "result"; audit: Audit }
  | { type: "error"; message: string };
