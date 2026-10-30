# Holdline

**Check a letter that cuts your services or benefits against the law that governs it.**
Holdline gives a family three things in about 30 seconds: the real deadline to keep what they have, the parts the law requires that the letter is missing, and a reply they can send tonight. Every line is a quote or a blank.

**Live demo: https://holdline-rho.vercel.app** · try a sample: [school notice](https://holdline-rho.vercel.app/check?sample=school-speech) · [Medicaid notice](https://holdline-rho.vercel.app/check?sample=medicaid-renewal) · [SNAP notice](https://holdline-rho.vercel.app/check?sample=snap-reduction)

Built for the **Nebius x NVIDIA Global AI Hackathon** · Track: **Best Apps and Agents** · Runs on **NVIDIA Nemotron via Nebius Token Factory** · Search by **Tavily** · MIT licensed.

---

## The problem

Families get official letters that take something away: a school cutting a child's special-education services, or a state ending Medicaid or food benefits. Federal rules spell out what those letters **must contain**, and families can usually **keep the service while they appeal**, if they act before a date that is often not written as a date at all ("within 10 days of the date of this notice").

- In January 2026 a federal court found that Florida's Medicaid termination notices "border on the incomprehensible" and violated due process. *Chianne D. v. Harris* (M.D. Fla.), [NHeLP case page](https://healthlaw.org/resource/chianne-d-et-al-v-jason-weida-middle-district-court-of-florida/)
- During the Medicaid unwinding, 69% of people disenrolled lost coverage for paperwork or procedural reasons, not because they were found ineligible. [KFF](https://www.kff.org/medicaid/issue-brief/medicaid-enrollment-and-unwinding-tracker/)
- Schools now draft IEPs with AI ([EdWeek](https://www.edweek.org/teaching-learning/teachers-are-using-ai-to-help-write-ieps-advocates-have-concerns/2025/10)), and parent guides warn families that chatbots can be wrong.

A chatbot that "explains your letter" makes this worse: fluent text, invented law, no deadline math. Holdline does the opposite.

## What it does

| | |
|---|---|
| **The Clock** | Finds every date printed on the page (by code, never by a model), turns "within 10 days of the date of this notice" into a calendar date with the math shown, and attaches the federal rule that protects you if you act in time. No date on the page → "Date unreadable", never a guess. One click adds it to your calendar with reminders. |
| **The Completeness Check** | Lists every element the regulation says the notice must contain, quoted word-for-word from ecfr.gov, and marks each one *in the letter* (with the sentence), *only in part*, or *missing*. |
| **Citation check** | Every law the letter cites is checked. A citation to a section that doesn't exist, or to a `[Reserved]` empty section, is struck through. |
| **The Reply** | A letter requesting the missing information and asking to keep current services during the dispute. Fixed wording + exact quotes + blanks. No model writes it. |
| **Find help** | Tavily searches, locked to parent-center, legal-aid, and state `.gov` domains, find the family's Parent Training and Information Center, free legal aid, and the official hearing page. |
| **In my language** | Plain-language summary in 11 languages with read-aloud. Quotes stay in the original. Translations that change any number are dropped. |
| **Readability** | Flesch–Kincaid grade of the letter, against the rule's own plain-language requirement. |
| **Evidence Packet** | One-click printable PDF of the whole audit to hand to an advocate. |
| **Sender mode** | The same engine for schools and agencies: check a draft notice before it goes out. |

Rule packs today: **IDEA prior written notice** (34 CFR 300.503, 300.518), **Medicaid adverse action** (42 CFR 431.210, 431.211, 431.230), **SNAP notice of adverse action** (7 CFR 273.13, 273.15).

## How it uses NVIDIA Nemotron on Nebius Token Factory

Models label, judge, and summarize. Code finds, verifies, and computes. Anything a model says that code cannot tie back to the letter or the regulation is dropped, and the drop is counted in the on-screen run log.

| Step | Engine | Why this one |
|---|---|---|
| Read a phone photo or scan | **Nemotron 3.5 Super VL** `nvidia/Nemotron-3.5-Super-VL` | Verbatim transcription of real-world letters |
| Label each date's meaning | **Nemotron 3 Nano** `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`, thinking off | Narrow, cheap, fast. It can only label dates code already found |
| Check letter against the law | **Nemotron 3 Ultra** `nvidia/Nemotron-3-Ultra-550b-a55b`, thinking on | The one hard reasoning step, run once. It can only cite sentence numbers that exist |
| Plain-language summary | **Nemotron 3 Super** `nvidia/nemotron-3-super-120b-a12b` | Each line must cite sentences; a line is removed if it adds a number, a date, a time word ("today"), or says something already happened that the letter does not |
| Translation | **Nemotron 3 Nano**, thinking off | Number-preserving guard on every item |
| Dates, deadline math, reply letter, readability | Code | Must be exact, so no model touches them |

The independent steps (date labels, regulation fetch, Ultra audit, citation checks, summary, help search) run in parallel, so a full check takes about 4 seconds and costs about half a cent.

Model IDs are discovered from `GET /v1/models` on Token Factory (override with `MODEL_*` env vars). The UI shows each call's model, latency, tokens, and estimated cost.

**Tavily** is the accuracy mechanism, not a search box: Tavily Extract pulls the live regulation from ecfr.gov (each required clause must match word-for-word before it is shown, with the official eCFR API and a bundled snapshot as fallbacks); domain-locked Tavily Search checks non-CFR citations and finds local help; every returned URL is re-checked against the allowlist.

## Accuracy, measured

`npm run eval` runs labelled fictional letters (3 samples + 6 more: complete notices, a letter with no deadline, a letter with no date at all, business-day counting, an explicit keep-by date) through the real pipeline and independently re-checks the guarantees.

<!-- EVAL:START -->
**Live mode**: NVIDIA Nemotron on Nebius Token Factory + Tavily, 9 letters:

| Metric | Result |
|---|---|
| Notice type detected | 9/9 (100%) |
| Deadline exact (or correctly "unreadable") | 9/9 (100%) |
| Required elements judged correctly | 51/51 (100%) |
| Missing elements caught | 12/12 (100%) |
| Bogus citations flagged | 1/1 |
| **Ungrounded statements shipped** | **0** |
| **Off-allowlist URLs shown** | **0** |
| AI statements blocked by the guards | 5 |
| Avg time per letter | 3.5s |
| Est. model cost per letter | $0.0047 |

<details><summary>Per letter</summary>

| Letter | Notice type | Deadline | Required elements |
|---|---|---|---|
| school-speech (sample) | ✓ | ✓ 2026-11-15 | 5/5 |
| medicaid-renewal (sample) | ✓ | ✓ 2026-11-05 | 5/5 |
| snap-reduction (sample) | ✓ | ✓ 2026-11-30 | 6/6 |
| idea-complete | ✓ | ✓ 2026-11-30 | 7/7 |
| idea-refusal-no-deadline | ✓ | ✓ unreadable | 6/6 |
| medicaid-explicit-keep-date | ✓ | ✓ 2026-11-12 | 5/5 |
| medicaid-no-notice-date | ✓ | ✓ unreadable | 4/4 |
| snap-business-days | ✓ | ✓ 2026-11-13 | 6/6 |
| snap-complete | ✓ | ✓ 2026-11-30 | 7/7 |

</details>

"AI statements blocked" is the guards working: a date label the sentence did not support, a summary line that added a time word like "today" not in the letter, or said coverage had already "ended" when the letter says it "will end". They were removed before reaching the user.

Honest scope: 9 fictional letters written by the team, 3 notice types. The guarantees (no ungrounded statement, no off-allowlist link) are re-checked by the eval independently of the pipeline. Full output: `evals/results/live.md`.
<!-- EVAL:END -->

`npm run verify-rulepacks` checks every quoted regulation clause against live eCFR text (all match as of 2026-10-26).

## Run it

Requirements: Node 20+.

```bash
npm install
cp .env.example .env    # add NEBIUS_API_KEY and TAVILY_API_KEY (see GET-KEYS.md)
npm run models          # see which Nemotron model fills each role
npm run dev             # http://localhost:3000
```

Without keys the app runs in a clearly labelled offline mode (code-only checks), and sample letters replay their recorded live run if `samples/recorded/` exists (`npm run record` creates it).

Other commands: `npm test` (unit tests) · `npm run eval` · `npm run verify-rulepacks` · `npm run build`.

**Deploy** (Nebius Serverless Endpoint or any container host): `docker build -t holdline .` then run with `NEBIUS_API_KEY` and `TAVILY_API_KEY` set; the server listens on port 8080.

## Privacy

Nothing is stored. Letters go only to Nemotron on Nebius Token Factory (and short search queries to Tavily). Names can be replaced on the user's device before anything is sent. Open models, your own key, no closed-model API sees the child's record.

## Project layout

```
app/                 Next.js app + API routes (/api/analyze streams NDJSON)
components/          Letter view with offset highlights, result cards, evidence packet
lib/pipeline.ts      The pipeline
lib/spans.ts         Exact-span matching and sentence splitting
lib/dates.ts         Deterministic date + deadline engine
lib/nebius.ts        Token Factory client, model-role resolution
lib/tavily.ts        Domain-locked search + extract
lib/ecfr.ts          Official eCFR API + snapshots
rulepacks/           The law each notice is checked against (+ eCFR snapshots)
evals/, scripts/     Eval suite, rule-pack verifier, model listing, run recorder
```

## Feedback on Nebius Token Factory and NVIDIA Nemotron

**What worked well**
- **OpenAI-compatible API**: switching the base URL was the whole integration. `GET /v1/models` let the app pick Nemotron models per role automatically.
- **Five Nemotron models on one key** (Nano, Lightning, Super, Super VL, Ultra) made a real routing design possible: cheap models for narrow jobs, Ultra once for the hard judgment.
- **Nemotron 3 Ultra** was precise on the legal-completeness task. It separated "mentions the rule" from "meets the rule" (*partial* vs *found*) the way an advocate would, in about 3 seconds per letter.
- **`response_format: json_object`** worked on every Nemotron model we used.
- **Cost**: about $0.005 per full letter check across four model calls.

**Friction and suggestions**
- **Thinking toggle**: passing `chat_template_kwargs: { enable_thinking: false }` made Nemotron 3 Nano about 3x faster (0.6s vs 2.0s, 54 vs 206 output tokens) with the same translation quality. This is a big win that is easy to miss; it deserves a prominent place in the Token Factory docs and playground.
- **Nemotron 3.5 Lightning** returned non-JSON on our structured translation prompt where Nano did not. A note on which models are tuned for JSON output would help.
- **Onboarding**: sign-up asked for a card before we found the hackathon promo code, and the first card was declined. Showing the promo-code field at sign-up would remove that blocker for participants.

**Tavily**
- **Extract** returned the full live text of 5 of 6 eCFR sections, so each required clause matched word-for-word. On the largest section (7 CFR 273.15) the extract did not include every clause, so Holdline fell back to the official eCFR API. That is why every source records how it was fetched.
- **`include_domains`** made it practical to use search as an accuracy control. We still had to filter results by state and drop off-topic PDFs for the "find help" step.

## Not legal advice

Holdline shows what a letter says and what the regulation says. It does not file anything or predict outcomes. A Parent Center, legal aid office, or advocate can help families decide what to do. Sample letters are fictional.
