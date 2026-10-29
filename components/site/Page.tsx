import Link from "next/link";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { Reveal } from "./Motion";

/** Inner-page shell: nav, a hero with breadcrumb and a per-page accent glow, footer. */
export function Page({
  crumb,
  eyebrow,
  title,
  lede,
  accent = "rgba(34, 211, 143, 0.14)",
  actions,
  children,
}: {
  crumb: string;
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  accent?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main>
        <section className="phero" style={{ ["--accent-glow" as string]: accent }}>
          <div className="wrap">
            <Reveal>
              <div className="crumbs"><Link href="/">Holdline</Link> / {crumb}</div>
              <div className="eyebrow brand" style={{ marginTop: 28 }}>{eyebrow}</div>
              <h1 className="h-lg">{title}</h1>
              {lede && <p className="lede">{lede}</p>}
              {actions && <div className="hero2-cta" style={{ marginTop: 24 }}>{actions}</div>}
            </Reveal>
          </div>
        </section>
        {children}
      </main>
      <Footer />
    </>
  );
}

export function CtaBand({ title = "Have a letter in front of you?", body = "Check it in about four seconds. Nothing is stored." }: { title?: string; body?: string }) {
  return (
    <section className="cta" style={{ borderTop: "1px solid var(--s-line)", padding: "110px 24px" }}>
      <Reveal>
        <h2 className="h-lg">{title}</h2>
        <p>{body}</p>
        <div className="hero2-cta">
          <Link href="/check" className="pill brand lg">Check a letter <span className="arr">→</span></Link>
          <Link href="/check?sample=school-speech" className="pill ghost lg">Try a sample</Link>
        </div>
      </Reveal>
    </section>
  );
}
