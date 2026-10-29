import Link from "next/link";
import type { Metadata } from "next";
import { PACKS } from "@/rulepacks";
import { CtaBand, Page } from "@/components/site/Page";
import { Reveal } from "@/components/site/Motion";

export const metadata: Metadata = { title: "Rules we check", description: "The federal regulations Holdline checks each notice against, quoted from ecfr.gov." };

export default function Rules() {
  return (
    <Page
      crumb="Rules we check"
      eyebrow="Rule packs"
      accent="rgba(14, 138, 138, 0.18)"
      title={<>Three kinds of letter. <span className="muted">One engine.</span></>}
      lede="Each rule pack is the federal regulation that says what a notice must contain and when a family can keep a service while they disagree. Every clause is quoted word for word from ecfr.gov and verified against the live text."
    >
      <section className="sec tight">
        <div className="wrap grid3">
          {PACKS.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <Link href={`/rules/${p.id}`} className="card2" style={{ height: "100%" }}>
                <div className="k">{p.sources.map((s) => s.cite).join(" · ")}</div>
                <h3 style={{ marginTop: 10, fontSize: 22 }}>{p.name}</h3>
                <p>{p.short}. {p.elements.length} required parts checked. Keep-your-{p.keepNoun} deadline computed from the letter.</p>
                <p className="link-arrow" style={{ marginTop: 16 }}>See the rules <span>→</span></p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand />
    </Page>
  );
}
