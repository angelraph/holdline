import Link from "next/link";
import type { Metadata } from "next";
import { CtaBand, Page } from "@/components/site/Page";
import { Reveal } from "@/components/site/Motion";
import { GuardDemo } from "@/components/site/GuardDemo";

export const metadata: Metadata = { title: "Accuracy", description: "How Holdline keeps AI from inventing anything, and the measured results." };

const GUARDS = [
  { id: "numbers", h: "Numbers and dates must exist", p: "A summary line is removed if it contains a number, amount, or date that is not in the letter sentences it cites." },
  { id: "anchors", h: "Deadlines keep their starting point", p: "“90 days from today” and “90 days from the date of this notice” share a number but not a date. A time word like “today”, “tomorrow”, or “from now” that the letter does not use removes the line." },
  { id: "tense", h: "Nothing “already ended” unless it did", p: "“We ended your coverage” tells a family it's too late. If the letter says coverage “will end”, a line that says “ended”, “stopped”, “terminated”, or “denied” is removed." },
  { id: "sentences", h: "Every finding points to a sentence", p: "Nemotron Ultra must name the sentence numbers behind each finding. A claim pointing to a sentence that doesn't exist is rejected and counted." },
  { id: "labels", h: "Date labels are double-checked", p: "If the model calls a date a deadline but the sentence has no action word, or calls it a response date when the sentence is about keeping services, code overrules it." },
  { id: "citations", h: "Fake citations are caught", p: "Every CFR section a letter cites is looked up on eCFR. Sections that don't exist, or exist only as “[Reserved]” with no rule in them, are struck through." },
  { id: "allowlist", h: "Links only from trusted domains", p: "Search is locked to an allowlist per notice type (ecfr.gov, parent centers, legal aid, state .gov), and every returned URL is re-checked before it's shown." },
  { id: "law", h: "Law quoted word for word", p: "Every regulation clause in the app is matched against the live eCFR text before it's shown. A build check fails if any quote drifts from the official text." },
];

export default function Accuracy() {
  return (
    <Page
      crumb="Accuracy"
      eyebrow="Trust, measured"
      accent="rgba(11, 111, 160, 0.18)"
      title={<>The product is the refusal. <span className="muted">If it isn&apos;t in the letter or the law, it isn&apos;t on the screen.</span></>}
      lede="Holdline uses AI where it helps (reading, labeling, judging) and code everywhere a mistake could cost a family their services."
    >
      <section className="sec tight">
        <div className="wrap">
          <Reveal>
            <div className="eyebrow">Live eval · NVIDIA Nemotron on Nebius + Tavily · 9 letters</div>
          </Reveal>
          <div className="stats" style={{ border: "1px solid var(--s-line)", borderRadius: 18, marginTop: 16, overflow: "hidden" }}>
            <div><b>9/9</b><span>deadlines exact, or correctly “unreadable”</span></div>
            <div><b>51/51</b><span>required parts judged correctly</span></div>
            <div><b>12/12</b><span>missing parts caught</span></div>
            <div><b className="grad-text">0</b><span>ungrounded statements · 0 off-allowlist links</span></div>
          </div>
          <p className="muted" style={{ fontSize: 14, marginTop: 14, maxWidth: 820 }}>
            Honest scope: 9 fictional letters written by the team across 3 notice types, including a letter with no deadline and one with no date at all. The guarantees are re-checked by the eval independently of the app. Guards blocked 5 incorrect AI statements during the run.{" "}
            <a href="https://github.com/angelraph/holdline/blob/main/evals/results/live.md" target="_blank" rel="noreferrer" style={{ color: "var(--b-green)" }}>Full results ↗</a>
          </p>
        </div>
      </section>

      <section className="sec tight" style={{ borderTop: "1px solid var(--s-line)" }}>
        <div className="wrap split">
          <Reveal><GuardDemo /></Reveal>
          <Reveal delay={100}>
            <h2 className="h-md">Real mistakes the guards caught</h2>
            <p className="muted" style={{ marginTop: 12 }}>
              These came from live runs. Nemotron is good. Ultra judged every required part correctly. But a fluent summary can still move a deadline&apos;s starting point or change its tense. Those are exactly the mistakes that cost families their rights, so code checks for them on every line.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sec tight" style={{ borderTop: "1px solid var(--s-line)" }}>
        <div className="wrap">
          <h2 className="h-md" style={{ marginBottom: 24 }}>The eight guards</h2>
          <div className="grid2">
            {GUARDS.map((g, i) => (
              <Reveal key={g.id} delay={(i % 2) * 80}>
                <div id={g.id} className="card2" style={{ scrollMarginTop: 90, height: "100%" }}>
                  <div className="k">Guard {String(i + 1).padStart(2, "0")}</div>
                  <h3 style={{ marginTop: 8 }}>{g.h}</h3>
                  <p>{g.p}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div style={{ marginTop: 28 }}>
            <Link href="/how-it-works" className="link-arrow">See where each guard sits in the pipeline <span>→</span></Link>
          </div>
        </div>
      </section>
      <CtaBand title="See the guards work on a real letter." />
    </Page>
  );
}
