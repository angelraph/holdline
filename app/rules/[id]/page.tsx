import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPack, PACKS } from "@/rulepacks";
import { SAMPLES } from "@/samples";
import { CtaBand, Page } from "@/components/site/Page";
import { Reveal } from "@/components/site/Motion";

export function generateStaticParams() {
  return PACKS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = getPack((await params).id);
  return { title: p ? p.name : "Rule pack" };
}

const ACCENT: Record<string, string> = {
  "idea-pwn": "rgba(34, 211, 143, 0.16)",
  "medicaid-adverse": "rgba(11, 111, 160, 0.2)",
  "snap-adverse": "rgba(242, 184, 91, 0.14)",
};

export default async function RulePackPage({ params }: { params: Promise<{ id: string }> }) {
  const pack = getPack((await params).id);
  if (!pack) notFound();
  const sample = SAMPLES.find((s) => s.packId === pack.id);
  const src = (id: string) => pack.sources.find((s) => s.id === id)!;
  return (
    <Page
      crumb={`Rules we check / ${pack.name}`}
      eyebrow={pack.short}
      accent={ACCENT[pack.id]}
      title={pack.name}
      lede={`What federal rules say a ${pack.short.toLowerCase()} must contain, and how a ${pack.recipientNoun} can keep their ${pack.keepNoun} while they disagree.`}
      actions={
        <>
          {sample && <Link href={`/check?sample=${sample.id}`} className="pill solid lg">Try the sample letter <span className="arr">→</span></Link>}
          <Link href="/check" className="pill ghost lg">Check your own</Link>
        </>
      }
    >
      <section className="sec tight">
        <div className="wrap">
          <h2 className="h-md" style={{ marginBottom: 18 }}>Required parts of the notice</h2>
          <div className="card2" style={{ padding: 0, overflowX: "auto" }}>
            <table className="table2">
              <thead><tr><th>Part</th><th>What the law says</th><th>Citation</th></tr></thead>
              <tbody>
                {pack.elements.map((e) => (
                  <tr key={e.id}>
                    <td><b>{e.label}</b><div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{e.plain}{e.optional ? " (required when it applies)" : ""}</div></td>
                    <td style={{ fontFamily: "var(--font-serif)", color: "#dfe5e6" }}>“{e.sourceQuote}”</td>
                    <td><a className="cite" href={src(e.sourceId).url} target="_blank" rel="noreferrer">{e.cite} ↗</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="h-md" style={{ margin: "56px 0 18px" }}>The deadline that keeps your {pack.keepNoun}</h2>
          <div className="grid2">
            {pack.clock.map((c, i) => (
              <Reveal key={c.id} delay={i * 80}>
                <div className="card2" style={{ height: "100%" }}>
                  <div className="k">{c.cite}</div>
                  <div className="lawq">“{c.sourceQuote}”</div>
                  <p style={{ marginTop: 10 }}>{c.meaning}</p>
                  <p style={{ marginTop: 10, color: "var(--s-ink)" }}><b>{c.action}</b></p>
                </div>
              </Reveal>
            ))}
            {pack.hearingWindowDays && (
              <Reveal delay={160}>
                <div className="card2" style={{ height: "100%" }}>
                  <div className="k">{pack.hearingWindowDays.cite}</div>
                  <div className="lawq">“{pack.hearingWindowDays.sourceQuote}”</div>
                  <p style={{ marginTop: 10 }}>Holdline adds {pack.hearingWindowDays.days} days to the letter date to show the outer limit for asking.</p>
                </div>
              </Reveal>
            )}
          </div>

          <h2 className="h-md" style={{ margin: "56px 0 18px" }}>Sources</h2>
          <div className="grid3">
            {pack.sources.map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="card2">
                <div className="k">{s.cite}</div>
                <h3 style={{ marginTop: 8 }}>{s.title}</h3>
                <p>Read on ecfr.gov ↗</p>
              </a>
            ))}
          </div>
          <div style={{ marginTop: 28, display: "flex", gap: 22, flexWrap: "wrap" }}>
            {PACKS.filter((p) => p.id !== pack.id).map((p) => (
              <Link key={p.id} href={`/rules/${p.id}`} className="link-arrow">{p.name} <span>→</span></Link>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </Page>
  );
}
