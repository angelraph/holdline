import Link from "next/link";
import type { Metadata } from "next";
import { CtaBand, Page } from "@/components/site/Page";
import { Reveal } from "@/components/site/Motion";

export const metadata: Metadata = { title: "For organizations", description: "Sender mode for schools and agencies, and Holdline for parent centers and legal aid." };

const WHO = [
  { k: "Schools & districts", h: "Check a prior written notice before it goes home", p: "Sender mode lists every required part of 34 CFR 300.503(b) that a draft is missing, flags citations that don't exist, and scores reading level against plain-language guidance." },
  { k: "State & county agencies", h: "Fix a notice before a court has to", p: "Check Medicaid and SNAP adverse-action notices against 42 CFR 431.210 and 7 CFR 273.13 before they're mailed. These are the content rules courts enforce." },
  { k: "Parent centers & legal aid", h: "Triage a stack of letters in minutes", p: "Every check produces a printable evidence packet: deadline with the math, each required part with the law's words and the letter's words, and a ready reply." },
];

export default function Organizations() {
  return (
    <Page
      crumb="For organizations"
      eyebrow="Both sides of the letter"
      accent="rgba(124, 240, 192, 0.14)"
      title={<>Catch the problem <span className="grad-text">before the letter is sent.</span></>}
      lede="The same engine that helps a family read a notice helps the people who write them. Sender mode turns Holdline into a pre-flight check for schools and agencies."
      actions={
        <>
          <Link href="/check?mode=send" className="pill solid lg">Try sender mode <span className="arr">→</span></Link>
          <a href="https://github.com/angelraph/holdline" target="_blank" rel="noreferrer" className="pill ghost lg">Self-host it ↗</a>
        </>
      }
    >
      <section className="sec tight">
        <div className="wrap grid3">
          {WHO.map((w, i) => (
            <Reveal key={w.k} delay={i * 80}>
              <div className="card2" style={{ height: "100%" }}>
                <div className="k">{w.k}</div>
                <h3 style={{ marginTop: 10 }}>{w.h}</h3>
                <p>{w.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="sec tight" style={{ borderTop: "1px solid var(--s-line)" }}>
        <div className="wrap grid2" style={{ alignItems: "start" }}>
          <Reveal>
            <h2 className="h-md">Why it is safe to deploy</h2>
            <div className="prose" style={{ marginTop: 10 }}>
              <ul>
                <li><strong>Open models, your key.</strong> Runs on NVIDIA Nemotron through Nebius Token Factory. No closed-model API sees a student or beneficiary record.</li>
                <li><strong>Nothing stored.</strong> Letters are processed in memory and never saved.</li>
                <li><strong>Open source, MIT.</strong> Self-host it with a Dockerfile, add your state&apos;s rules as a new rule pack.</li>
                <li><strong>Auditable.</strong> Every result has a run log: which model ran, what it cost, which sources were used, what was blocked.</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="h-md">Add a rule pack</h2>
            <p className="muted" style={{ marginTop: 10 }}>
              A rule pack is a short file: the regulation&apos;s required parts quoted word for word, the deadline rule, and the reply template. A build check verifies every quote against the live eCFR text.
            </p>
            <div style={{ marginTop: 18, display: "flex", gap: 22, flexWrap: "wrap" }}>
              <Link href="/rules" className="link-arrow">See current rule packs <span>→</span></Link>
              <Link href="/accuracy" className="link-arrow">How accuracy is enforced <span>→</span></Link>
            </div>
          </Reveal>
        </div>
      </section>
      <CtaBand title="See what your notices look like to a family." body="Paste a draft into sender mode. Nothing is stored." />
    </Page>
  );
}
