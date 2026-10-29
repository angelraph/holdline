import Link from "next/link";
import { Wordmark } from "./Brand";

const COLS = [
  { title: "Product", links: [["Check a letter", "/check"], ["Try a sample", "/check?sample=school-speech"], ["Sender mode", "/check?mode=send"], ["How it works", "/how-it-works"], ["Accuracy", "/accuracy"]] },
  { title: "Rules", links: [["All rule packs", "/rules"], ["School (IDEA) notices", "/rules/idea-pwn"], ["Medicaid notices", "/rules/medicaid-adverse"], ["SNAP notices", "/rules/snap-adverse"]] },
  { title: "Resources", links: [["Get free help", "/get-help"], ["FAQ", "/faq"], ["For organizations", "/organizations"], ["Source code", "https://github.com/angelraph/holdline"]] },
  { title: "Company", links: [["About", "/about"], ["Privacy", "/privacy"], ["Terms", "/terms"]] },
];

export function Footer() {
  return (
    <footer className="s-foot no-print">
      <div className="s-foot-in">
        <div className="s-foot-brand">
          <Wordmark size={26} />
          <p>Keep your services. Fight back.</p>
          <p className="s-foot-small">Runs on NVIDIA Nemotron via Nebius Token Factory · search by Tavily · regulation text from ecfr.gov · MIT licensed.</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title} className="s-foot-col">
            <div className="s-foot-h">{c.title}</div>
            {c.links.map(([label, href]) =>
              href.startsWith("http") ? (
                <a key={href} href={href} target="_blank" rel="noreferrer">{label} ↗</a>
              ) : (
                <Link key={href} href={href}>{label}</Link>
              ),
            )}
          </div>
        ))}
      </div>
      <div className="s-foot-bar">
        <span>Not legal advice. Holdline shows what a letter says and what the regulation says.</span>
        <span>© 2026 Holdline</span>
      </div>
    </footer>
  );
}
