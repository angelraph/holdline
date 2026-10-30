import Link from "next/link";
import type { Metadata } from "next";
import { CtaBand, Page } from "@/components/site/Page";
import { Reveal } from "@/components/site/Motion";

export const metadata: Metadata = { title: "Get free help", description: "Free, trusted places to get help with a school, Medicaid, or SNAP letter." };

const GROUPS = [
  {
    h: "School and special education",
    items: [
      { t: "Find your Parent Center", d: "Every state has a federally funded Parent Training and Information Center that helps families of children with disabilities, for free.", u: "https://www.parentcenterhub.org/find-your-center/", host: "parentcenterhub.org" },
      { t: "CADRE: dispute resolution", d: "The national center on dispute resolution in special education: mediation, IEP facilitation, due process, and state complaints explained.", u: "https://www.cadreworks.org/", host: "cadreworks.org" },
      { t: "Protection & Advocacy agencies", d: "Each state's disability rights agency, which can provide legal help to people with disabilities.", u: "https://www.ndrn.org/about/ndrn-member-agencies/", host: "ndrn.org" },
    ],
  },
  {
    h: "Medicaid and health coverage",
    items: [
      { t: "Find free legal aid", d: "Legal Services Corporation's directory of free civil legal aid programs near you.", u: "https://www.lsc.gov/about-lsc/what-legal-aid/get-legal-help", host: "lsc.gov" },
      { t: "HealthCare.gov", d: "If you lose Medicaid, you may qualify for other coverage. Check options here.", u: "https://www.healthcare.gov/", host: "healthcare.gov" },
    ],
  },
  {
    h: "SNAP (food assistance)",
    items: [
      { t: "SNAP state directory", d: "Contact information for every state's SNAP agency, including hotlines and where to request a fair hearing.", u: "https://www.fns.usda.gov/snap/state-directory", host: "fns.usda.gov" },
      { t: "Find free legal aid", d: "Free civil legal aid programs, including help with benefits hearings.", u: "https://www.lsc.gov/about-lsc/what-legal-aid/get-legal-help", host: "lsc.gov" },
    ],
  },
];

export default function GetHelp() {
  return (
    <Page
      crumb="Get help"
      eyebrow="You don't have to do this alone"
      accent="rgba(242, 184, 91, 0.12)"
      title={<>Free help from people who do this <span className="grad-text">every day.</span></>}
      lede="Holdline shows what your letter says and what the law says. These organizations can help you decide what to do. When you check a letter, Holdline also searches for help in your state."
      actions={<Link href="/check" className="pill solid lg">Check my letter first <span className="arr">→</span></Link>}
    >
      <section className="sec tight">
        <div className="wrap" style={{ display: "grid", gap: 48 }}>
          {GROUPS.map((g) => (
            <div key={g.h}>
              <h2 className="h-md" style={{ marginBottom: 16 }}>{g.h}</h2>
              <div className="grid3">
                {g.items.map((it, i) => (
                  <Reveal key={it.t + g.h} delay={i * 70}>
                    <a href={it.u} target="_blank" rel="noreferrer" className="card2" style={{ height: "100%" }}>
                      <div className="k">{it.host} ↗</div>
                      <h3 style={{ marginTop: 8 }}>{it.t}</h3>
                      <p>{it.d}</p>
                    </a>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
          <div className="card2" style={{ borderColor: "rgba(255,107,94,0.35)" }}>
            <h3>Is your deadline very close?</h3>
            <p>Don&apos;t wait for an appointment. Most agencies accept a hearing request by phone or in writing, and the number is usually on the letter. Ask for the hearing first and say you want your current services or benefits to continue; get help with the details after. Holdline&apos;s reply letter is written to be sent as-is.</p>
          </div>
        </div>
      </section>
      <CtaBand />
    </Page>
  );
}
