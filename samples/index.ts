// Fictional letters written for Holdline. No real child, family, district, or agency.
// Each one is built from patterns families report seeing, with known gaps.

export type Sample = { id: string; title: string; blurb: string; packId: string; state: string; text: string };

export const SAMPLES: Sample[] = [
  {
    id: "school-speech",
    title: "School cuts speech therapy",
    blurb: "A prior written notice reducing a 3rd grader's speech therapy from 60 to 20 minutes a week.",
    packId: "idea-pwn",
    state: "Oregon",
    text: `Cedar Valley School District
Department of Special Education
1400 Orchard Lane, Cedar Valley, Oregon 97000

Date: October 27, 2026

To the Parent/Guardian of: Jordan M.
Student ID: 0048213
Grade: 3

PRIOR WRITTEN NOTICE

The district is providing this notice regarding a proposed change to your child's Individualized Education Program (IEP).

Action proposed: The district proposes to reduce speech-language therapy services from 60 minutes per week to 20 minutes per week and to change the service delivery model from individual sessions to a consultation model.

The IEP team determined that this change is appropriate based on data reviewed by the team. Jordan has made progress toward the articulation goals in the current IEP.

This proposal is consistent with 34 CFR 300.320 and the service reduction standards in 34 CFR 300.326.

These changes will be implemented beginning November 16, 2026, unless otherwise agreed.

Parents of a child with a disability have protection under the procedural safeguards of the Individuals with Disabilities Education Act. A copy of the Notice of Procedural Safeguards was provided to you at the last annual IEP meeting.

If you have questions about this notice, please contact the Special Education office.

Sincerely,
M. Alvarez
Program Administrator, Special Education`,
  },
  {
    id: "medicaid-renewal",
    title: "Medicaid coverage ending",
    blurb: "A renewal termination notice with a 10-day window to keep coverage during an appeal.",
    packId: "medicaid-adverse",
    state: "Pennsylvania",
    text: `Riverbend County Health Coverage Office
220 Front Street
Riverbend, Pennsylvania 17000

NOTICE OF ACTION
Notice Date: October 26, 2026
Case Number: 55-0193-7741

Dear Dana R.,

Your Medical Assistance (Medicaid) coverage will end on November 30, 2026.

Reason: We did not receive the information needed to complete your renewal.

If you think we made a mistake, you have the right to ask for a fair hearing. You must ask for a hearing within 90 days of the date of this notice.

If you ask for a hearing within 10 days of the date of this notice, your benefits may continue until a decision is made.

To ask for a hearing, call 1-800-555-0142 or write to the address above.

This notice does not affect other household members.`,
  },
  {
    id: "snap-reduction",
    title: "Food benefits cut in half",
    blurb: "A SNAP notice dropping a household from $412 to $186 a month, missing several required parts.",
    packId: "snap-adverse",
    state: "Texas",
    text: `Lone Pine County Family Services
88 Mesquite Road, Lone Pine, Texas 79000

NOTICE OF CHANGE IN SNAP BENEFITS
Date mailed: October 23, 2026
Case: 7720-4418

Dear Household Member,

Your SNAP benefits will be reduced from $412 to $186 per month beginning December 1, 2026.

This change is due to an update in your household income.

You have the right to request a fair hearing if you disagree with this decision.

You may also contact your caseworker with questions.

Lone Pine County Family Services`,
  },
];
