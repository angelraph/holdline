// A rule pack is the law a notice is checked against. Everything a user reads as
// "the law says" comes from `sourceQuote`, which must be an exact substring of the
// regulation text (checked against live eCFR by `npm run verify-rulepacks`).
// Everything a user reads as "what this means" comes from `plain`/`meaning`, which is
// fixed, human-written text — never model output.

export type RegSource = {
  id: string; // e.g. "34-300.503"
  cite: string; // "34 CFR 300.503"
  title: string;
  url: string; // human-readable eCFR page (used for Tavily Extract and links)
  ecfr: { title: number; part: string; section: string }; // versioner API coordinates
};

export type RequiredElement = {
  id: string;
  cite: string; // "34 CFR 300.503(b)(3)"
  sourceId: string;
  sourceQuote: string; // exact regulation text
  label: string; // short name
  plain: string; // what a family should look for, plain words
  ask: string; // sentence used in the reply when this element is missing
  keywords: RegExp[]; // offline fallback detector only
  optional?: boolean; // required only when it applies (e.g. free legal services if available)
};

export type DateRole =
  | "notice_date" // the date the letter was written or mailed
  | "effective" // the date the change happens
  | "keep_by" // act by this date to keep the current service/benefit
  | "respond_by" // other response or hearing-request deadline
  | "meeting" // a scheduled meeting
  | "other";

export type ClockRule = {
  id: string;
  role: DateRole; // which date in the letter this rule attaches to
  cite: string;
  sourceId: string;
  sourceQuote: string;
  meaning: string; // fixed explanation shown under the date
  action: string; // what to do before the date
};

export type HelpQuery = {
  id: string;
  label: string;
  query: (state: string) => string;
  domains: (state: string) => string[];
  mustMentionState?: boolean; // drop results that are not about the user's state
  allowPdf?: boolean;
  topic?: RegExp; // drop results whose title + URL are not about this topic
  fixed?: { title: string; url: string }[]; // trusted directory links always shown first
};

export type RulePack = {
  id: "idea-pwn" | "medicaid-adverse" | "snap-adverse";
  name: string; // "School special-education notice"
  short: string; // "IDEA prior written notice"
  senderNoun: string; // "school district"
  keepNoun: string; // "services" | "coverage" | "benefits"
  plainLanguage?: { cite: string; sourceId: string; sourceQuote: string };
  recipientNoun: string; // "parent"
  detect: RegExp[]; // offline notice-type detection
  allowlist: string[]; // domains Tavily may return for this pack
  sources: RegSource[];
  elements: RequiredElement[];
  clock: ClockRule[];
  hearingWindowDays?: { days: number; cite: string; sourceId: string; sourceQuote: string; label: string };
  reply: {
    subject: string;
    opening: string;
    disagree: string;
    keepIt: string;
    closing: string;
    slots: string[]; // blanks the family fills in
  };
  help: HelpQuery[];
};
