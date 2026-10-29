import Link from "next/link";
import type { Metadata } from "next";
import { Page } from "@/components/site/Page";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <Page crumb="Terms" eyebrow="Terms of use" title="Using Holdline" lede="Short and plain. Last updated October 30, 2026.">
      <section className="sec tight">
        <div className="wrap prose">
          <h2>Not legal advice</h2>
          <p>Holdline shows what a letter says and what a federal regulation says, and computes dates from the letter&apos;s own words. It is not a lawyer, does not give legal advice, and does not create an attorney-client relationship. State rules can add to or differ from federal rules. For advice about your situation, contact a <Link href="/get-help">Parent Center, legal aid office, or advocate</Link>.</p>
          <h2>Check important dates yourself</h2>
          <p>Holdline shows every step of its date math so you can check it. If a date matters, confirm it with the sender in writing. When in doubt, act earlier.</p>
          <h2>Your responsibility</h2>
          <p>You decide whether and how to use the reply letter. Fill in the blanks, review it, and keep a copy with the date you sent it.</p>
          <h2>No warranty</h2>
          <p>Holdline is provided free, as is, without warranty of any kind, under the MIT license.</p>
          <h2>Acceptable use</h2>
          <p>Don&apos;t use Holdline to harm others, to process letters you have no right to share, or to overload the service.</p>
        </div>
      </section>
    </Page>
  );
}
