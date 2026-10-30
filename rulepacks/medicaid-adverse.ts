import type { RulePack } from "./types";
import { legalAidDomains, stateGovDomains } from "./idea-pwn";

const S210 = "42-431.210";
const S211 = "42-431.211";
const S230 = "42-431.230";

export const medicaidAdverse: RulePack = {
  id: "medicaid-adverse",
  name: "Medicaid coverage notice",
  short: "Medicaid termination or reduction notice",
  senderNoun: "agency",
  keepNoun: "coverage",
  recipientNoun: "beneficiary",
  detect: [/medicaid/i, /medical assistance/i, /\bCHIP\b/, /health coverage/i, /coverage will (end|stop)/i],
  allowlist: ["ecfr.gov", "medicaid.gov", "cms.gov", "healthcare.gov", "lawhelp.org", "lsc.gov", "healthlaw.org"],
  sources: [
    {
      id: S210,
      cite: "42 CFR 431.210",
      title: "Content of notice",
      url: "https://www.ecfr.gov/current/title-42/section-431.210",
      ecfr: { title: 42, part: "431", section: "431.210" },
    },
    {
      id: S211,
      cite: "42 CFR 431.211",
      title: "Advance notice",
      url: "https://www.ecfr.gov/current/title-42/section-431.211",
      ecfr: { title: 42, part: "431", section: "431.211" },
    },
    {
      id: S230,
      cite: "42 CFR 431.230",
      title: "Maintaining services",
      url: "https://www.ecfr.gov/current/title-42/section-431.230",
      ecfr: { title: 42, part: "431", section: "431.230" },
    },
  ],
  elements: [
    {
      id: "action",
      cite: "42 CFR 431.210(a)",
      sourceId: S210,
      sourceQuote: "A statement of what action the agency, skilled nursing facility, or nursing facility intends to take and the effective date of such action",
      label: "What will happen, and when",
      plain: "What the agency is going to do, and the exact date it takes effect.",
      ask: "a statement of the action the agency intends to take and the effective date of that action",
      keywords: [/(will|is going to) (be )?(end|stop|terminat|reduc|chang|cancel|clos)/i, /effective/i],
    },
    {
      id: "reasons",
      cite: "42 CFR 431.210(b)",
      sourceId: S210,
      sourceQuote: "A clear statement of the specific reasons supporting the intended action",
      label: "The specific reasons",
      plain: "The specific reason for the decision about you — not a general category.",
      ask: "a clear statement of the specific reasons supporting the intended action",
      keywords: [/because/i, /\breason/i, /due to/i, /we did not receive/i, /income/i],
    },
    {
      id: "regulations",
      cite: "42 CFR 431.210(c)",
      sourceId: S210,
      sourceQuote: "The specific regulations that support, or the change in Federal or State law that requires, the action",
      label: "The rule they relied on",
      plain: "The specific regulation or law that supports the decision.",
      ask: "the specific regulations that support the action, or the change in law that requires it",
      keywords: [/\bC\.?F\.?R\.?\b/, /\bregulation/i, /\bsection\s+\d/i, /§/, /administrative code/i, /\bstatute/i],
    },
    {
      id: "hearing",
      cite: "42 CFR 431.210(d)",
      sourceId: S210,
      sourceQuote: "The individual's right to request a local evidentiary hearing if one is available, or a State agency hearing",
      label: "Your right to a hearing",
      plain: "That you have the right to ask for a hearing, and how.",
      ask: "an explanation of my right to request a hearing",
      keywords: [/fair hearing/i, /\bhearing\b/i, /\bappeal/i],
    },
    {
      id: "continuation",
      cite: "42 CFR 431.210(e)",
      sourceId: S210,
      sourceQuote: "An explanation of the circumstances under which Medicaid is continued if a hearing is requested",
      label: "How to keep coverage during an appeal",
      plain: "When your coverage continues if you ask for a hearing.",
      ask: "an explanation of the circumstances under which my Medicaid continues if I request a hearing",
      keywords: [/continu/i, /keep (your )?(medicaid|coverage|benefits|health)/i, /while you appeal/i, /remain (open|active)/i],
    },
  ],
  clock: [
    {
      id: "maintain",
      role: "effective",
      cite: "42 CFR 431.230(a)",
      sourceId: S230,
      sourceQuote:
        "the beneficiary requests a hearing before the date of action, the agency may not terminate or reduce services until a decision is rendered after the hearing",
      meaning:
        "If you ask for a hearing before the date of action, federal rules keep your services in place until the hearing decision, with narrow exceptions. Your state may set an earlier date in the letter; if it does, use the earlier one.",
      action: "Before this date, request a fair hearing and say you want your coverage to continue.",
    },
  ],
  reply: {
    subject: "Request for fair hearing and continued coverage — Case [CASE NUMBER]",
    opening: "My name is [YOUR NAME]. I received the agency's notice dated [NOTICE DATE] about my Medicaid coverage.",
    disagree: "I disagree with this action and I am requesting a fair hearing.",
    keepIt: "I am requesting that my coverage continue while the hearing is pending, as provided in 42 CFR 431.230(a).",
    closing: "Please confirm receipt of this request in writing. You can reach me at [YOUR PHONE OR EMAIL].",
    slots: ["[YOUR NAME]", "[CASE NUMBER]", "[NOTICE DATE]", "[YOUR PHONE OR EMAIL]", "[DATE]"],
  },
  help: [
    {
      id: "legal",
      label: "Free legal help",
      query: (s) => `${s} free legal aid Medicaid fair hearing`,
      domains: (s) => legalAidDomains(s),
      topic: /medicaid|medi-cal|health|public[ -]?benefit|hearing|appeal/i,
      mustMentionState: true,
      fixed: [{ title: "Find free legal aid near you (Legal Services Corporation)", url: "https://www.lsc.gov/about-lsc/what-legal-aid/get-legal-help" }],
    },
    {
      id: "state",
      label: "State Medicaid fair hearing page",
      query: (s) => `${s} Medicaid fair hearing request`,
      domains: (s) => stateGovDomains(s),
      topic: /hearing|appeal/i,
      allowPdf: true,
    },
  ],
};
