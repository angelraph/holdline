import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CtaBand, Page } from "@/components/site/Page";
import { Reveal } from "@/components/site/Motion";

export const metadata: Metadata = { title: "About", description: "Why Holdline exists." };

export default function About() {
  return (
    <Page
      crumb="About"
      eyebrow="Our mission"
      title={<>Hold the line <span className="grad-text">on the letter that takes it away.</span></>}
      lede="Families lose services they're entitled to because a deadline is buried, a required explanation is missing, or a chatbot invents the law. Holdline exists to make the letter checkable."
    >
      <section className="sec tight">
        <div className="wrap grid2" style={{ alignItems: "center" }}>
          <Reveal>
            <div className="prose">
              <h2 style={{ marginTop: 0 }}>Why we built it</h2>
              <p>Letters that cut a child&apos;s therapy or end a family&apos;s health coverage follow the same pattern. The law lists what they must say. The family can usually keep the service if they act in time. And the date that matters is rarely written as a date.</p>
              <p>In 2026 a federal court found one state&apos;s Medicaid termination notices so unclear they violated due process. Schools now draft notices with AI. Families paste those letters into chatbots that answer fluently and sometimes invent the law.</p>
              <p><strong>Holdline is the other side of that letter.</strong> It quotes, computes, and checks. It refuses to write anything it can&apos;t trace to the letter or the regulation.</p>
              <h2>The name</h2>
              <p>To hold the line is to not lose ground. That&apos;s the whole job: help a family keep what they have while they push back.</p>
              <h2>Built with</h2>
              <p>NVIDIA Nemotron open models on Nebius Token Factory, Tavily for live regulation and local help, and the official eCFR. Built for the Nebius × NVIDIA Global AI Hackathon, open source under MIT.</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="card2" style={{ background: "#faf8f6", padding: 28 }}>
              <Image src="/brand/source.webp" alt="Holdline. Keep your services. Fight back." width={1536} height={1024} style={{ width: "100%", height: "auto" }} />
            </div>
            <div style={{ marginTop: 18, display: "flex", gap: 22, flexWrap: "wrap" }}>
              <Link href="/accuracy" className="link-arrow">How we stay accurate <span>→</span></Link>
              <a href="https://github.com/angelraph/holdline" target="_blank" rel="noreferrer" className="link-arrow">Source code ↗</a>
            </div>
          </Reveal>
        </div>
      </section>
      <CtaBand />
    </Page>
  );
}
