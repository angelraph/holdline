import Link from "next/link";
import type { Metadata } from "next";
import { CtaBand, Page } from "@/components/site/Page";
import { Reveal } from "@/components/site/Motion";

export const metadata: Metadata = { title: "How it works", description: "The Holdline pipeline: what NVIDIA Nemotron does, what code does, and how every line is checked." };

const STEPS = [
  { id: "read", n: "01", h: "Read the letter", engine: "Nemotron 3.5 Super VL · or the PDF text layer", body: "A PDF's own text is used directly. A phone photo or scan is transcribed word for word by the vision-language Nemotron model, with an instruction never to summarize or correct." },
  { id: "find", n: "02", h: "Find every date and citation", engine: "Code", body: "A date parser reads every calendar date printed on the page, with its exact position. Relative deadlines like “within 10 days of the date of this notice” are found by pattern, never guessed. Every legal citation is located too." },
  { id: "label", n: "03", h: "Label what each date means", engine: "Nemotron 3 Nano · thinking off", body: "The fast model labels dates the code already found: letter date, effective date, keep-by deadline. It cannot add a date. Code then re-checks every label against the sentence's own words and overrules labels the sentence does not support." },
  { id: "law", n: "04", h: "Pull the law, live", engine: "Tavily Extract → eCFR API → snapshot", body: "The regulation that governs this notice is pulled live from ecfr.gov. Every clause Holdline will show is matched word for word in that text first. If a source can't be reached, the official eCFR API is tried, then a bundled snapshot — and the run log says which was used." },
  { id: "judge", n: "05", h: "Check the letter against the law", engine: "Nemotron 3 Ultra · runs once", body: "The large reasoning model gets the letter as numbered sentences and the regulation's required parts. For each part it says found, partial, or missing — and names the sentence numbers. A claim that points to a sentence that doesn't exist is rejected." },
  { id: "clock", n: "06", h: "Compute the deadlines", engine: "Code", body: "Date math is done in code, step by step, and shown to you. “Before December 1” means the last safe day is November 30. Weekdays skip weekends; holidays aren't skipped, so the date shown is the earliest — the safe one. No date on the page? The clock says “unreadable” and never guesses." },
  { id: "summary", n: "07", h: "Explain it plainly", engine: "Nemotron 3 Super · guarded", body: "A plain-language summary, each line citing the sentences it came from. Code removes any line that adds a number or date not in those sentences, a time word like “today”, or says something already happened when the letter says it will." },
  { id: "reply", n: "08", h: "Write the reply", engine: "Code · no model", body: "The reply letter is fixed wording, exact quotes from your notice, and blanks for you to fill in. It asks for every missing required part by name and citation, and asks that current services continue while you disagree." },
  { id: "help", n: "09", h: "Find real help", engine: "Tavily · domain-locked", body: "Searches are locked to parent-center, legal-aid, and state .gov domains, and every result URL is re-checked against that list before it's shown." },
];

export default function HowItWorks() {
  return (
    <Page
      crumb="How it works"
      eyebrow="The pipeline"
      title={<>Models label and judge. <span className="grad-text">Code finds, checks, and computes.</span></>}
      lede="Four NVIDIA Nemotron models on Nebius Token Factory, each with one job. Everything a model says must be tied back to the letter or the regulation, or it is dropped — and the drop is counted in the run log you can open on every result."
      actions={<Link href="/check?sample=medicaid-renewal" className="pill solid lg">Run it on a sample <span className="arr">→</span></Link>}
    >
      <section className="sec tight">
        <div className="wrap">
          <div className="steps2" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 56 }}>
            {[
              ["Nano", "Labels and translation", "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B"],
              ["Super", "Plain summary", "nvidia/nemotron-3-super-120b-a12b"],
              ["Super VL", "Reads photos", "nvidia/Nemotron-3.5-Super-VL"],
              ["Ultra", "Letter vs. law", "nvidia/Nemotron-3-Ultra-550b-a55b"],
            ].map(([n, h, id]) => (
              <div key={n}>
                <div className="num">NEMOTRON</div>
                <h4>{n}</h4>
                <p>{h}</p>
                <p className="mono" style={{ fontSize: 11.5, color: "var(--s-ink3)", marginTop: 8, wordBreak: "break-all" }}>{id}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            {STEPS.map((s, i) => (
              <Reveal key={s.id} delay={i * 40}>
                <div id={s.id} className="card2" style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 18, scrollMarginTop: 90 }}>
                  <div className="mono" style={{ color: "var(--b-green)", fontSize: 22 }}>{s.n}</div>
                  <div>
                    <h3>{s.h}</h3>
                    <div className="k" style={{ marginBottom: 8 }}>{s.engine}</div>
                    <p>{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <div style={{ marginTop: 32, display: "flex", gap: 22, flexWrap: "wrap" }}>
            <Link href="/accuracy" className="link-arrow">See the accuracy results <span>→</span></Link>
            <Link href="/rules" className="link-arrow">See the rules we check <span>→</span></Link>
          </div>
        </div>
      </section>
      <CtaBand />
    </Page>
  );
}
