"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "./Brand";

export const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/accuracy", label: "Accuracy" },
  { href: "/rules", label: "Rules we check" },
  { href: "/organizations", label: "For organizations" },
  { href: "/get-help", label: "Get help" },
  { href: "/faq", label: "FAQ" },
];

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [path]);

  return (
    <header className={`s-nav no-print ${scrolled ? "scrolled" : ""} ${open ? "open" : ""}`}>
      <div className="s-nav-in">
        <Wordmark size={28} />
        <nav className="s-links" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={path.startsWith(n.href) ? "on" : ""}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="s-nav-cta">
          <Link href="/check?sample=medicaid-renewal" className="pill ghost hide-sm">Try a sample</Link>
          <Link href="/check" className="pill solid">Check a letter</Link>
          <button className="s-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span /><span />
          </button>
        </div>
      </div>
      {open && (
        <nav className="s-mobile" aria-label="Mobile">
          {NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
          <Link href="/about">About</Link>
          <Link href="/check" className="pill solid">Check a letter</Link>
        </nav>
      )}
    </header>
  );
}
