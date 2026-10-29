import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { GlowMark } from "@/components/site/Brand";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="cta" style={{ padding: "80px 24px 120px" }}>
        <div style={{ display: "grid", placeItems: "center", position: "relative" }}><GlowMark size={180} /></div>
        <div className="eyebrow brand" style={{ marginTop: 20 }}>404</div>
        <h1 className="h-lg">This page isn&apos;t on the letter.</h1>
        <p>The page you&apos;re looking for doesn&apos;t exist.</p>
        <div className="hero2-cta">
          <Link href="/" className="pill solid lg">Go home</Link>
          <Link href="/check" className="pill ghost lg">Check a letter</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
