import Link from "next/link";
import type { Metadata } from "next";
import { CtaBand, Page } from "@/components/site/Page";

export const metadata: Metadata = { title: "FAQ", description: "Questions about Holdline: what it does, accuracy, privacy, and the law." };

type QA = { q: string; a: React.ReactNode };
const SECTIONS: { id: string; title: string; items: QA[] }[] = [
  {
    id: "basics",
    title: "The basics",
    items: [
      { q: "What does Holdline do?", a: <>It checks a letter that cuts or ends a service (a school special-education notice, a Medicaid notice, or a SNAP notice) against the federal rule for what that letter must contain. You get the real deadline to keep what you have, the required parts that are missing, which cited laws are real, and a reply you can send.</> },
      { q: "Is it free?", a: <>Yes. Holdline is free and open source under the MIT license.</> },
      { q: "Which letters does it check?", a: <>Today: school prior written notices under IDEA (34 CFR 300.503), Medicaid termination or reduction notices (42 CFR 431.210), and SNAP notices of adverse action (7 CFR 273.13). See <Link href="/rules">the rules we check</Link>. Other letters can still be read, but the completeness check is built for these three.</> },
      { q: "Is this legal advice?", a: <>No. Holdline shows what your letter says and what the regulation says, word for word, and does the date math. It doesn&apos;t predict outcomes or file anything. A Parent Center, legal aid office, or advocate can help you decide what to do. See <Link href="/get-help">free help</Link>.</> },
    ],
  },
  {
    id: "deadlines",
    title: "Deadlines",
    items: [
      { q: "How does it find my deadline?", a: <>Code reads every date printed on the letter. Phrases like “within 10 days of the date of this notice” are turned into a calendar date, and every step of the math is shown. The AI can label what a date means but can never create one. <Link href="/how-it-works#clock">More</Link>.</> },
      { q: "What if my letter has no date?", a: <>The clock says “Date unreadable” and tells you what to ask the sender for. Holdline never guesses a deadline.</> },
      { q: "Why is the date one day earlier than in my letter?", a: <>If the letter says to act <em>before</em> a date, the last safe day is the day before. When a deadline counts business or school days, Holdline shows the earliest it could be, which is the safe date to use.</> },
      { q: "What does “keep your services” mean?", a: <>For school notices, the law keeps a child in their current placement while a due process complaint is pending (34 CFR 300.518). For Medicaid and SNAP, benefits generally continue if you request a hearing in time (42 CFR 431.230, 7 CFR 273.15). Holdline quotes the rule and shows the date that matters.</> },
    ],
  },
  {
    id: "accuracy",
    title: "Accuracy and AI",
    items: [
      { q: "How do I know the AI didn't make something up?", a: <>Every finding must point to a real sentence in your letter, and every law is quoted word for word from ecfr.gov. Code removes any summary line that adds a number, date, time word like “today”, or says something already happened when it didn&apos;t. The run log shows what was blocked. <Link href="/accuracy">See the guards and results</Link>.</> },
      { q: "Which AI models does it use?", a: <>Four open NVIDIA Nemotron models on Nebius Token Factory: Nano for labels and translation, Super for the plain summary, Super VL for photos, and Ultra for the letter-versus-law check. Tavily pulls the regulation and finds local help.</> },
      { q: "Who wrote the reply letter?", a: <>No AI. It&apos;s fixed wording, exact quotes from your notice, and highlighted blanks for you to fill in.</> },
      { q: "What does a struck-through citation mean?", a: <>The letter cites a regulation that doesn&apos;t exist, or one that eCFR lists as “[Reserved]” with no rule in it. That&apos;s worth asking the sender about.</> },
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    items: [
      { q: "Do you store my letter?", a: <>No. Your letter is processed in memory and not saved. See the <Link href="/privacy">privacy page</Link>.</> },
      { q: "Can I hide my child's name?", a: <>Yes. List names before checking and they are replaced on your device before anything is sent.</> },
      { q: "Who sees my letter?", a: <>It is sent to NVIDIA Nemotron models on Nebius Token Factory to be read. Short search phrases (like your state and notice type) go to Tavily to find help. Nothing goes to a closed-model API.</> },
    ],
  },
  {
    id: "using",
    title: "Using Holdline",
    items: [
      { q: "Can I use a photo of my letter?", a: <>Yes. Upload a phone photo and Nemotron Super VL transcribes it word for word. PDFs work too.</> },
      { q: "Does it work in other languages?", a: <>The summary and key actions can be shown in 11 languages, with read-aloud. Quotes stay in the original language so the evidence never changes.</> },
      { q: "I work at a school or agency. Can I use it?", a: <>Yes. <Link href="/organizations">sender mode</Link> checks a draft notice before it goes out.</> },
    ],
  },
];

export default function FAQ() {
  return (
    <Page
      crumb="FAQ"
      eyebrow="Questions"
      accent="rgba(11, 111, 160, 0.16)"
      title="Frequently asked questions"
      lede="Straight answers about what Holdline does, how it stays accurate, and what happens to your letter."
    >
      <section className="sec tight">
        <div className="wrap">
          <nav className="faq-cats" aria-label="FAQ sections">
            {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}
          </nav>
          {SECTIONS.map((s) => (
            <div key={s.id} id={s.id} style={{ scrollMarginTop: 90, marginBottom: 48 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>{s.title}</div>
              <div className="faq">
                {s.items.map((it, i) => (
                  <details key={it.q} open={s.id === "basics" && i === 0}>
                    <summary>{it.q}</summary>
                    <div className="a">{it.a}</div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <CtaBand title="Still unsure? Try it on a sample." />
    </Page>
  );
}
