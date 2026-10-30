import Link from "next/link";
import type { Metadata } from "next";
import { Page } from "@/components/site/Page";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <Page crumb="Privacy" eyebrow="Privacy" title="Your letter is yours." lede="Plain-language summary of what happens to what you upload. Last updated October 30, 2026.">
      <section className="sec tight">
        <div className="wrap prose">
          <h2>What we don&apos;t do</h2>
          <ul>
            <li>We don&apos;t store your letter, your results, or your reply.</li>
            <li>We don&apos;t require an account.</li>
            <li>We don&apos;t sell or share data, and we don&apos;t use letters to train models.</li>
            <li>We don&apos;t use advertising or tracking cookies.</li>
          </ul>
          <h2>What happens when you check a letter</h2>
          <ul>
            <li><strong>Reading:</strong> the letter text (or photo) is sent to NVIDIA Nemotron models on Nebius Token Factory to be read and checked, then the result is returned to your browser.</li>
            <li><strong>Search:</strong> short queries (such as your state and the type of notice, never the letter itself) are sent to Tavily to find regulation text and local help.</li>
            <li><strong>Regulations:</strong> regulation text is fetched from the official eCFR.</li>
          </ul>
          <h2>Hiding names</h2>
          <p>Before checking, you can list names to hide. They are replaced with “[REDACTED]” in your browser, before anything leaves your device.</p>
          <h2>Downloads stay with you</h2>
          <p>Calendar files, reply letters, and evidence packets are generated in your browser and saved to your device only.</p>
          <h2>Self-hosting</h2>
          <p>Organizations can run Holdline on their own infrastructure with their own Nebius key. See the <a href="https://github.com/angelraph/holdline" target="_blank" rel="noreferrer">source code</a>.</p>
          <p>Questions? Read the <Link href="/faq#privacy">privacy FAQ</Link>.</p>
        </div>
      </section>
    </Page>
  );
}
