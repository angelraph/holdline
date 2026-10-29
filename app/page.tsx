import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { GlowMark } from "@/components/site/Brand";
import { Countdown, Reveal, Ribbon, Spotlight, TiltOnScroll } from "@/components/site/Motion";
import { GuardDemo } from "@/components/site/GuardDemo";

export default function Landing() {
  return (
    <>
      <Nav />
      <main>
        {/* ---------------- Hero (Vercel pattern) ---------------- */}
        <section className="hero2">
          <div className="wrap frame">
            <div className="hero2-grid">
              <div className="hero2-copy">
                <Countdown to="2026-11-05" label="Sample notice · coverage deadline in" />
                <h1 className="h-xl">
                  Keep your services.
                  <br />
                  <span className="grad-text">Fight back.</span>
                </h1>
                <div className="hero2-cta">
                  <Link href="/check" className="pill solid lg">Check a letter <span className="arr">→</span></Link>
                  <Link href="/check?sample=school-speech" className="pill ghost lg">Try a sample</Link>
                </div>
                <p className="hero2-sub">
                  When a school cuts a child&apos;s services or an agency ends Medicaid or food benefits, Holdline checks the letter against the law that governs it.
                </p>
              </div>
              <GlowMark size={340} />
              <ul className="hero2-list">
                <li><span>01</span>Finds the real deadline</li>
                <li><span>02</span>Shows what the law requires that is missing</li>
                <li><span>03</span>Writes a reply you can send tonight</li>
                <li><span>04</span>Never invents a line</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ---------------- Built on (Linear/Vercel logo wall) ---------------- */}
        <div className="wrap frame" style={{ padding: 0 }}>
          <div className="strip">
            <div>NVIDIA Nemotron<small>4 open models</small></div>
            <div>Nebius<small>Token Factory</small></div>
            <div>Tavily<small>domain-locked search</small></div>
            <div>eCFR<small>live federal rules</small></div>
            <div>Open source<small>MIT licensed</small></div>
          </div>
          <div className="strip-cap eyebrow">Built on open infrastructure · your data is never stored</div>
        </div>

        {/* ---------------- Two-tone statement (Linear) ---------------- */}
        <section className="sec">
          <div className="wrap">
            <Reveal>
              <p className="two-tone">
                <b>A letter is not just words.</b> It is a deadline that is already running, a list of rights the law says must be there, and a choice that has to be made before a date. Holdline reads it the way an advocate would — and refuses to invent a single sentence.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ---------------- Product preview (Linear tilt) ---------------- */}
        <section style={{ paddingBottom: 40 }}>
          <div className="wrap">
            <TiltOnScroll>
              <div className="mock">
                <div className="mock-bar">
                  <i /><i /><i />
                  <span style={{ marginLeft: 8 }}>holdline · Medicaid termination notice</span>
                  <span className="chip">LIVE · Nemotron 3 Ultra</span>
                </div>
                <div className="mock-body">
                  <div className="mock-letter">
                    Riverbend County Health Coverage Office
                    <br />Notice Date: <mark>October 26, 2026</mark>
                    <br />
                    <br />Your Medical Assistance (Medicaid) coverage will end on <mark>November 30, 2026</mark>.
                    <br />
                    <br /><span className="el">Reason: We did not receive the information needed to complete your renewal.</span>
                    <br />
                    <br />If you ask for a hearing <mark>within 10 days of the date of this notice</mark>, your benefits may continue until a decision is made.
                  </div>
                  <div className="mock-side">
                    <div className="mock-clock">
                      <b>7</b>
                      <div>
                        <small>Act by this date to keep your coverage</small>
                        <span>Thursday, November 5, 2026</span>
                      </div>
                    </div>
                    <div className="mock-row"><span className="dot-ok">✓</span>What will happen, and when<span className="tag-ok">In the letter</span></div>
                    <div className="mock-row"><span className="dot-part">!</span>The specific reasons<span className="tag-part">Only in part</span></div>
                    <div className="mock-row"><span className="dot-miss">✕</span>The rule they relied on<span className="tag-miss">Missing</span></div>
                    <div className="mock-row"><span className="dot-part">!</span>Your right to a hearing<span className="tag-part">Only in part</span></div>
                    <div className="mock-row"><span className="dot-ok">✓</span>Keeping coverage during an appeal<span className="tag-ok">In the letter</span></div>
                  </div>
                </div>
              </div>
            </TiltOnScroll>
          </div>
        </section>

        {/* ---------------- Bento (Stripe) ---------------- */}
        <section className="sec">
          <div className="wrap">
            <Reveal>
              <div className="eyebrow brand">What you get</div>
              <h2 className="h-lg" style={{ margin: "14px 0 44px", maxWidth: 820 }}>
                Everything a family needs before the date. <span className="muted">In about four seconds.</span>
              </h2>
            </Reveal>
            <div className="bento">
              <Reveal className="b w4">
                <Spotlight>
                  <div className="b-in">
                    <Link href="/how-it-works#clock" className="expand" aria-label="Learn about the clock">↗</Link>
                    <h3>The Clock</h3>
                    <p>Every date is read from the page by code — never by a model. Relative deadlines become calendar dates, with the math shown.</p>
                    <div className="b-ui math">
                      &quot;within 10 days of the date of this notice&quot;
                      <br />October 26, 2026 + 10 calendar days = <b>Thursday, November 5, 2026</b>
                      <br />42 CFR 431.230(a): services continue if you ask before the date of action.
                    </div>
                  </div>
                </Spotlight>
              </Reveal>
              <Reveal className="b" delay={80}>
                <Spotlight>
                  <div className="b-in">
                    <Link href="/accuracy#citations" className="expand" aria-label="Learn about citation checks">↗</Link>
                    <h3>Fake-citation catcher</h3>
                    <p>Every law a letter cites is checked against eCFR.</p>
                    <div className="b-ui">
                      <div className="hostrow"><span>34 CFR 300.320</span><span className="tag-ok">real rule</span></div>
                      <div className="hostrow"><span style={{ textDecoration: "line-through", textDecorationColor: "#ff6b5e" }}>34 CFR 300.326</span><span className="tag-miss">[Reserved]</span></div>
                    </div>
                  </div>
                </Spotlight>
              </Reveal>
              <Reveal className="b" delay={0}>
                <Spotlight>
                  <div className="b-in">
                    <Link href="/rules" className="expand" aria-label="See the rules">↗</Link>
                    <h3>What the law requires</h3>
                    <p>Each required part, quoted word-for-word from ecfr.gov, marked found, partial, or missing.</p>
                    <div className="b-ui">
                      <div className="hostrow"><span>Options considered</span><span className="tag-miss">Missing</span></div>
                      <div className="hostrow"><span>Tests and records used</span><span className="tag-part">Only in part</span></div>
                    </div>
                  </div>
                </Spotlight>
              </Reveal>
              <Reveal className="b" delay={80}>
                <Spotlight>
                  <div className="b-in">
                    <Link href="/how-it-works#reply" className="expand" aria-label="About the reply">↗</Link>
                    <h3>A reply, tonight</h3>
                    <p>Fixed wording, exact quotes, and blanks. No AI writes it.</p>
                    <div className="b-ui q">
                      I am the parent of <span className="slot">[CHILD&apos;S NAME]</span>. I do not agree with this action. Please provide, in writing: a description of the other options the IEP Team considered…
                    </div>
                  </div>
                </Spotlight>
              </Reveal>
              <Reveal className="b" delay={160}>
                <Spotlight>
                  <div className="b-in">
                    <Link href="/check?sample=medicaid-renewal" className="expand" aria-label="Try languages">↗</Link>
                    <h3>In 11 languages</h3>
                    <p>Plain-language summary with read-aloud. Numbers can never change in translation.</p>
                    <div className="b-ui q">Su cobertura de Medicaid termina el 30 de noviembre de 2026.</div>
                  </div>
                </Spotlight>
              </Reveal>
              <Reveal className="b w3" delay={0}>
                <Spotlight>
                  <div className="b-in">
                    <Link href="/get-help" className="expand" aria-label="Get help">↗</Link>
                    <h3>Real help, in your state</h3>
                    <p>Tavily searches locked to parent-center, legal-aid, and state .gov sites only.</p>
                    <div className="b-ui">
                      <div className="hostrow"><span>Oregon due process hearing request</span><span>oregon.gov</span></div>
                      <div className="hostrow"><span>Special education guide for parents</span><span>oregonlawhelp.org</span></div>
                      <div className="hostrow"><span>Find your Parent Center</span><span>parentcenterhub.org</span></div>
                    </div>
                  </div>
                </Spotlight>
              </Reveal>
              <Reveal className="b w3" delay={80}>
                <Spotlight>
                  <div className="b-in">
                    <Link href="/organizations" className="expand" aria-label="For organizations">↗</Link>
                    <h3>Sender mode</h3>
                    <p>Schools and agencies check a draft notice before it goes out — missing parts and reading level, fixed before a family ever sees it.</p>
                    <div className="b-ui">
                      <div className="hostrow"><span>Reading level</span><span className="tag-part">grade 10.3 → aim for 8</span></div>
                      <div className="hostrow"><span>Required parts</span><span className="tag-miss">2 missing</span></div>
                    </div>
                  </div>
                </Spotlight>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------------- Guard demo split (Vercel) ---------------- */}
        <section className="sec" style={{ borderTop: "1px solid var(--s-line)" }}>
          <div className="wrap">
            <Reveal>
              <h2 className="h-lg" style={{ maxWidth: 820, marginBottom: 48 }}>
                Watch it catch the AI.
              </h2>
            </Reveal>
            <div className="split">
              <Reveal>
                <GuardDemo />
              </Reveal>
              <Reveal delay={120}>
                <p className="stat-big">
                  <b>0 ungrounded statements</b> reached a family across every letter we tested — because code checks every line Nemotron writes.
                </p>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Guards</div>
                <div className="feat-list">
                  <Link href="/accuracy#numbers">Numbers and dates must exist in the letter</Link>
                  <Link href="/accuracy#anchors">Deadlines keep their starting point</Link>
                  <Link href="/accuracy#tense">Nothing “already ended” unless it did</Link>
                  <Link href="/accuracy#allowlist">Links only from trusted domains</Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------------- Stats band with ribbon (Stripe) ---------------- */}
        <section className="band">
          <Ribbon />
          <div className="wrap frame" style={{ padding: 0 }}>
            <div className="stats">
              <div><b>9/9</b><span>deadlines exact, or correctly “unreadable”</span></div>
              <div><b>51/51</b><span>required parts judged correctly</span></div>
              <div><b className="grad-text">0</b><span>ungrounded statements shipped</span></div>
              <div><b>$0.005</b><span>per letter, about 4 seconds</span></div>
            </div>
          </div>
        </section>

        {/* ---------------- Numbered steps (Linear) ---------------- */}
        <section className="sec">
          <div className="wrap">
            <Reveal>
              <div className="eyebrow brand">How it works</div>
              <h2 className="h-lg" style={{ margin: "14px 0 40px", maxWidth: 760 }}>Models label and judge. Code finds, checks, and computes.</h2>
            </Reveal>
            <div className="steps2">
              {[
                ["1.0", "Read", "Upload a PDF, paste text, or snap a photo. Nemotron Super VL reads scans word for word."],
                ["2.0", "Find", "Code finds every date and every citation on the page, with exact positions."],
                ["3.0", "Judge", "Nemotron 3 Ultra checks the letter against the regulation, pulled live from ecfr.gov by Tavily."],
                ["4.0", "Guard", "Every finding must point to a real sentence. Anything that doesn't is dropped and counted."],
              ].map(([n, h, p], i) => (
                <Reveal key={n} delay={i * 90}>
                  <div className="num">{n}</div>
                  <h4>{h}</h4>
                  <p>{p}</p>
                </Reveal>
              ))}
            </div>
            <div style={{ marginTop: 28 }}>
              <Link href="/how-it-works" className="link-arrow">See the full pipeline <span>→</span></Link>
            </div>
          </div>
        </section>

        {/* ---------------- Why (proof) ---------------- */}
        <section className="sec" style={{ borderTop: "1px solid var(--s-line)" }}>
          <div className="wrap grid2" style={{ alignItems: "start" }}>
            <Reveal>
              <div className="eyebrow brand">Why it matters</div>
              <h2 className="h-lg" style={{ marginTop: 14 }}>The letters are still confusing. A court said so this year.</h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="lawq" style={{ fontSize: 22 }}>&ldquo;border on the incomprehensible&rdquo;</div>
              <p className="muted" style={{ marginTop: 10 }}>
                A federal court on Florida&apos;s Medicaid termination notices, January 2026 —{" "}
                <a className="link-arrow" style={{ display: "inline" }} href="https://healthlaw.org/resource/chianne-d-et-al-v-jason-weida-middle-district-court-of-florida/" target="_blank" rel="noreferrer">Chianne D. v. Harris ↗</a>
              </p>
              <p className="muted">
                During the Medicaid unwinding, 69% of people disenrolled lost coverage for paperwork reasons, not because they were found ineligible (
                <a href="https://www.kff.org/medicaid/issue-brief/medicaid-enrollment-and-unwinding-tracker/" target="_blank" rel="noreferrer" style={{ color: "var(--b-green)" }}>KFF</a>).
              </p>
              <div style={{ marginTop: 18, display: "flex", gap: 18, flexWrap: "wrap" }}>
                <Link href="/about" className="link-arrow">Our mission <span>→</span></Link>
                <Link href="/faq" className="link-arrow">Read the FAQ <span>→</span></Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="cta" style={{ borderTop: "1px solid var(--s-line)" }}>
          <Reveal>
            <div className="eyebrow brand">Free · private · open source</div>
            <h2 className="h-lg">Built for the families the letter forgets. Available today.</h2>
            <p>Not legal advice — the letter&apos;s own words and the law&apos;s own words, side by side.</p>
            <div className="hero2-cta">
              <Link href="/check" className="pill brand lg">Check a letter <span className="arr">→</span></Link>
              <Link href="/get-help" className="pill ghost lg">Find free help</Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
