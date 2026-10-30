import type { RulePack } from "./types";

const S503 = "34-300.503";
const S518 = "34-300.518";
const S507 = "34-300.507";

export const ideaPwn: RulePack = {
  id: "idea-pwn",
  name: "School special-education notice",
  short: "IDEA prior written notice",
  senderNoun: "school district",
  keepNoun: "services",
  plainLanguage: { cite: "34 CFR 300.503(c)(1)(i)", sourceId: S503, sourceQuote: "Written in language understandable to the general public" },
  recipientNoun: "parent",
  detect: [
    /prior written notice/i,
    /\bIEP\b/,
    /special education/i,
    /individualized education program/i,
    /related services/i,
    /\bFAPE\b/,
  ],
  allowlist: ["ecfr.gov", "ed.gov", "sites.ed.gov", "parentcenterhub.org", "lawhelp.org", "lsc.gov", "copaa.org"],
  sources: [
    {
      id: S503,
      cite: "34 CFR 300.503",
      title: "Prior notice by the public agency; content of notice",
      url: "https://www.ecfr.gov/current/title-34/section-300.503",
      ecfr: { title: 34, part: "300", section: "300.503" },
    },
    {
      id: S518,
      cite: "34 CFR 300.518",
      title: "Child's status during proceedings",
      url: "https://www.ecfr.gov/current/title-34/section-300.518",
      ecfr: { title: 34, part: "300", section: "300.518" },
    },
    {
      id: S507,
      cite: "34 CFR 300.507",
      title: "Filing a due process complaint",
      url: "https://www.ecfr.gov/current/title-34/section-300.507",
      ecfr: { title: 34, part: "300", section: "300.507" },
    },
  ],
  elements: [
    {
      id: "action",
      cite: "34 CFR 300.503(b)(1)",
      sourceId: S503,
      sourceQuote: "A description of the action proposed or refused by the agency",
      label: "What the school is doing",
      plain: "A clear description of what the school wants to change, or is refusing to change.",
      ask: "a description of the action proposed or refused",
      keywords: [/propos/i, /refus/i, /will (be )?(reduc|chang|end|remov|discontinu)/i, /reduc/i],
    },
    {
      id: "explanation",
      cite: "34 CFR 300.503(b)(2)",
      sourceId: S503,
      sourceQuote: "An explanation of why the agency proposes or refuses to take the action",
      label: "Why",
      plain: "The school's reasons for the decision, not just the decision.",
      ask: "an explanation of why the district proposes or refuses to take this action",
      keywords: [/because/i, /\breason/i, /due to/i, /based on/i, /determined that/i],
    },
    {
      id: "evaluations",
      cite: "34 CFR 300.503(b)(3)",
      sourceId: S503,
      sourceQuote:
        "A description of each evaluation procedure, assessment, record, or report the agency used as a basis for the proposed or refused action",
      label: "Tests and records used",
      plain: "Each test, assessment, record, or report the decision was based on, named one by one.",
      ask: "a description of each evaluation procedure, assessment, record, or report used as a basis for this action",
      keywords: [/evaluat/i, /assessment/i, /progress report/i, /\brecords?\b/i, /data/i, /\btest(ing|s)?\b/i, /observation/i],
    },
    {
      id: "safeguards",
      cite: "34 CFR 300.503(b)(4)",
      sourceId: S503,
      sourceQuote:
        "A statement that the parents of a child with a disability have protection under the procedural safeguards of this part and, if this notice is not an initial referral for evaluation, the means by which a copy of a description of the procedural safeguards can be obtained",
      label: "Your rights, and how to get a copy",
      plain: "A statement that you have procedural safeguards (your legal rights), and how to get a copy of them.",
      ask: "a statement of my procedural safeguards and the means by which I can obtain a copy",
      keywords: [/procedural safeguards/i, /parent(al)? rights/i, /your rights/i],
    },
    {
      id: "assistance",
      cite: "34 CFR 300.503(b)(5)",
      sourceId: S503,
      sourceQuote: "Sources for parents to contact to obtain assistance in understanding the provisions of this part",
      label: "Who you can call for help",
      plain: "Named people or organizations you can contact for help understanding your rights.",
      ask: "sources I can contact to obtain assistance in understanding these provisions",
      keywords: [/parent (training|center|information)/i, /assistance/i, /contact .{0,40}(help|questions)/i, /advocate/i, /legal aid/i],
    },
    {
      id: "options",
      cite: "34 CFR 300.503(b)(6)",
      sourceId: S503,
      sourceQuote:
        "A description of other options that the IEP Team considered and the reasons why those options were rejected",
      label: "Other options considered",
      plain: "Other options the IEP team looked at, and why each one was rejected.",
      ask: "a description of the other options the IEP Team considered and the reasons those options were rejected",
      keywords: [/option/i, /alternative/i, /considered/i, /rejected/i],
    },
    {
      id: "factors",
      cite: "34 CFR 300.503(b)(7)",
      sourceId: S503,
      sourceQuote: "A description of other factors that are relevant to the agency's proposal or refusal",
      label: "Other relevant factors",
      plain: "Anything else that affected the decision, such as staffing, scheduling, or the child's other needs.",
      ask: "a description of other factors relevant to this proposal or refusal",
      keywords: [/factor/i, /also (took|taken) into account/i, /other consideration/i],
    },
  ],
  clock: [
    {
      id: "stay-put",
      role: "effective",
      cite: "34 CFR 300.518(a)",
      sourceId: S518,
      sourceQuote: "the child involved in the complaint must remain in his or her current educational placement",
      meaning:
        "While a due process complaint is pending, the law keeps the child in the current placement, unless you and the school agree otherwise or an exception applies. Acting before the change takes effect is what keeps the current services in place.",
      action: "Before this date, talk to your Parent Center or an advocate about filing a due process complaint.",
    },
  ],
  hearingWindowDays: undefined,
  reply: {
    subject: "Response to Prior Written Notice dated [NOTICE DATE], [CHILD'S NAME]",
    opening:
      "I am the parent of [CHILD'S NAME]. I received the district's notice and I am writing about the proposed action described in it.",
    disagree: "I do not agree with this action.",
    keepIt:
      "I am asking that [CHILD'S NAME] continue to receive the current services and placement while this disagreement is resolved, as provided in 34 CFR 300.518(a).",
    closing:
      "Please send the missing information in writing and contact me to schedule an IEP meeting. You can reach me at [YOUR PHONE OR EMAIL].",
    slots: ["[CHILD'S NAME]", "[NOTICE DATE]", "[YOUR NAME]", "[YOUR PHONE OR EMAIL]", "[DATE]"],
  },
  help: [
    {
      id: "pti",
      label: "Parent Training and Information Center",
      query: (s) => `${s} Parent Training and Information Center PTI parent center`,
      domains: () => ["parentcenterhub.org"],
      mustMentionState: true,
      fixed: [{ title: "Find your Parent Center (official national directory)", url: "https://www.parentcenterhub.org/find-your-center/" }],
    },
    {
      id: "legal",
      label: "Free legal help",
      query: (s) => `${s} free legal aid special education`,
      domains: (s) => legalAidDomains(s),
      topic: /special[ -]?ed|education|school|IEP|disabilit/i,
      mustMentionState: true,
      fixed: [{ title: "Find free legal aid near you (Legal Services Corporation)", url: "https://www.lsc.gov/about-lsc/what-legal-aid/get-legal-help" }],
    },
    {
      id: "state",
      label: "State due process / dispute resolution page",
      query: (s) => `${s} department of education special education due process complaint form`,
      domains: (s) => stateGovDomains(s),
      topic: /due[ -]?process|dispute|complaint|hearing|procedural|safeguard/i,
      allowPdf: true,
    },
  ],
};

/** Statewide legal-aid portals usually live at <state>lawhelp.org or lawhelp<abbr>.org. */
export function legalAidDomains(state: string): string[] {
  const name = state.toLowerCase().replace(/[^a-z]/g, "");
  const abbr = (STATE_ABBR[state] ?? "").toLowerCase();
  return ["lsc.gov", "lawhelp.org", `${name}lawhelp.org`, abbr ? `lawhelp${abbr}.org` : "", `${name}legalaid.org`, `${name}legalhelp.org`].filter(Boolean);
}

export function stateGovDomains(state: string): string[] {
  const name = state.toLowerCase().replace(/[^a-z]/g, "");
  const abbr = STATE_ABBR[state] ?? "";
  return [`${name}.gov`, abbr ? `${abbr.toLowerCase()}.gov` : "", abbr ? `${abbr.toLowerCase()}.us` : ""].filter(Boolean);
}

export const STATE_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO", Connecticut: "CT",
  Delaware: "DE", "District of Columbia": "DC", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL",
  Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT",
  Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA",
  "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};
