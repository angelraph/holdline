// Hand-labelled fictional letters. "present" = found or partial; "any" = reasonable
// reviewers could disagree, so it is not scored.
import { SAMPLES } from "../samples";

export type Expect = "present" | "missing" | "any";
export type EvalCase = {
  id: string;
  packId: string;
  text: string;
  primary: { iso: string; kind: "keep" | "respond" } | "unreadable";
  elements: Record<string, Expect>;
  badCitations?: string[]; // citations that must be flagged
};

const sample = (id: string) => SAMPLES.find((s) => s.id === id)!.text;

export const CASES: EvalCase[] = [
  {
    id: "school-speech (sample)",
    packId: "idea-pwn",
    text: sample("school-speech"),
    primary: { iso: "2026-11-15", kind: "keep" },
    elements: { action: "present", explanation: "present", evaluations: "any", safeguards: "present", assistance: "any", options: "missing", factors: "missing" },
    badCitations: ["34 CFR 300.326"],
  },
  {
    id: "medicaid-renewal (sample)",
    packId: "medicaid-adverse",
    text: sample("medicaid-renewal"),
    primary: { iso: "2026-11-05", kind: "keep" },
    elements: { action: "present", reasons: "present", regulations: "missing", hearing: "present", continuation: "present" },
  },
  {
    id: "snap-reduction (sample)",
    packId: "snap-adverse",
    text: sample("snap-reduction"),
    primary: { iso: "2026-11-30", kind: "keep" },
    elements: { action: "present", reason: "present", hearing: "present", phone: "missing", continued: "missing", liability: "missing", legal: "any" },
  },
  {
    id: "idea-complete",
    packId: "idea-pwn",
    primary: { iso: "2026-11-30", kind: "keep" },
    elements: { action: "present", explanation: "present", evaluations: "present", safeguards: "present", assistance: "present", options: "present", factors: "present" },
    text: `Lakeside Unified School District
Office of Student Services, Lakeside, Michigan 48000

Date: October 20, 2026

PRIOR WRITTEN NOTICE OF PROPOSED ACTION

Student: A. Rivera

1. Action proposed: The district proposes to change Avery's placement from a general education classroom with resource support to a special day class for mathematics.

2. Reason: The district proposes this change because Avery has not met three of four math goals and needs more intensive instruction than the resource room can provide.

3. Evaluations and records used: the August 2026 psychoeducational evaluation by the school psychologist; the KeyMath-3 assessment given on September 15; quarterly IEP progress reports from 2025-26; and teacher observation notes.

4. Other options considered: the team considered increasing resource room time from 3 to 5 hours per week, which was rejected because the data show the current hours have not closed the gap, and considered a paraprofessional in general education, which was rejected because Avery needs direct specialist instruction.

5. Other relevant factors: the team also took into account Avery's strong reading progress and preference to stay with peers for non-math subjects.

6. Procedural safeguards: As the parent of a child with a disability you have protection under the procedural safeguards of IDEA. You can get a copy of the Procedural Safeguards Notice from the school office, at lakeside.example.org/safeguards, or by calling 555-0110.

7. For help understanding your rights, contact the Michigan Alliance for Families Parent Training and Information Center at 555-0199, or Legal Aid of Michigan at 555-0188.

This change will take effect on December 1, 2026.`,
  },
  {
    id: "idea-refusal-no-deadline",
    packId: "idea-pwn",
    primary: "unreadable",
    elements: { action: "present", explanation: "present", evaluations: "any", safeguards: "missing", assistance: "missing", options: "missing", factors: "missing" },
    text: `Pine Hills School District
Pine Hills, Colorado 80000

October 22, 2026

Dear Parent,

You asked the district to evaluate your son for special education services. The district refuses to conduct this evaluation at this time.

The reason is that his grades are passing and his teachers report no concerns.

Thank you,
Student Services`,
  },
  {
    id: "medicaid-explicit-keep-date",
    packId: "medicaid-adverse",
    primary: { iso: "2026-11-12", kind: "keep" },
    elements: { action: "present", reasons: "present", regulations: "present", hearing: "present", continuation: "present" },
    text: `North Fork County Medical Assistance Unit
North Fork, Ohio 43000

Notice date: October 28, 2026

Your Medicaid will end on November 20, 2026 because your monthly income of $2,410 is above the limit of $1,800 for your household size, under Ohio Administrative Code 5160:1-4-01 and 42 CFR 435.603.

You have the right to request a state hearing.

To keep your Medicaid while you appeal, you must request a hearing by November 12, 2026.`,
  },
  {
    id: "medicaid-no-notice-date",
    packId: "medicaid-adverse",
    primary: "unreadable",
    elements: { action: "present", reasons: "any", regulations: "missing", hearing: "present", continuation: "present" },
    text: `County Health Coverage Office

Your health coverage will stop at the end of next month.

Reason: renewal not completed.

If you ask for a hearing within 10 days of the date of this notice, your coverage may continue during the appeal.`,
  },
  {
    id: "snap-business-days",
    packId: "snap-adverse",
    primary: { iso: "2026-11-13", kind: "keep" },
    elements: { action: "present", reason: "present", hearing: "present", phone: "present", continued: "present", liability: "missing", legal: "any" },
    text: `Valley County SNAP Office
Valley, Georgia 30000

Date: October 30, 2026

Your SNAP benefits will be reduced from $350 to $210 per month starting December 1, 2026, because your reported earnings increased.

You have the right to request a fair hearing. If you request a fair hearing within ten (10) business days of the date of this notice, you can keep getting your current benefits until the hearing decision.

Questions? Call 1-800-555-0177.`,
  },
  {
    id: "snap-complete",
    packId: "snap-adverse",
    primary: { iso: "2026-11-30", kind: "keep" },
    elements: { action: "present", reason: "present", hearing: "present", phone: "present", continued: "present", liability: "present", legal: "present" },
    text: `Harbor County Family Assistance
Harbor, Washington 98000

Date mailed: October 21, 2026

What is changing: Your SNAP benefits will stop on December 1, 2026.

Why: Your household's gross income of $3,900 is over the limit for a household of two.

Your rights: You have the right to request a fair hearing. If you ask for a hearing before December 1, 2026, your benefits can continue until the hearing decision. If you lose the hearing, you may have to pay back the benefits you got while waiting.

Contact: Call the SNAP office toll-free at 1-800-555-0123 and ask for Caseworker J. Lee.

Free legal help: Northwest Legal Services provides free legal representation. Call 1-800-555-0166.`,
  },
];
