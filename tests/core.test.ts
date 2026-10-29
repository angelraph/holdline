import { describe, expect, it } from "vitest";
import { findSpan, splitSentences, factTokens, newDoneWords, newTimeAnchors } from "@/lib/spans";
import { addBusinessDays, computeRelative, daysUntil, findDates, findRelativeDeadlines } from "@/lib/dates";
import { findCitations } from "@/lib/citations";
import { readability } from "@/lib/readability";
import { hostAllowed } from "@/lib/tavily";
import { buildReply } from "@/lib/reply";
import { detectPack, getPack, PACKS } from "@/rulepacks";
import { SAMPLES } from "@/samples";

describe("spans", () => {
  it("finds quotes across curly quotes, dashes, case, and line breaks", () => {
    const doc = "The district’s proposal —\nreduce   services.";
    const s = findSpan(doc, "the district's proposal - reduce services");
    expect(s).not.toBeNull();
    expect(doc.slice(s!.start, s!.end)).toBe("The district’s proposal —\nreduce   services");
  });
  it("returns null for text that is not there", () => {
    expect(findSpan("Your benefits will end.", "Your benefits will continue")).toBeNull();
  });
  it("splits sentences without breaking on CFR abbreviations", () => {
    const ss = splitSentences("See 34 C.F.R. 300.503 for details. Then call us.");
    expect(ss.map((s) => s.text)).toEqual(["See 34 C.F.R. 300.503 for details.", "Then call us."]);
  });
  it("fact tokens catch numbers and money", () => {
    expect(factTokens("Benefits drop from $412 to $186 on 12/1/2026.")).toEqual(["$412", "$186", "12/1/2026"]);
  });
});

describe("time-anchor guard", () => {
  it("blocks a summary that moves a deadline to today", () => {
    const src = "You must ask for a hearing within 90 days of the date of this notice.";
    expect(newTimeAnchors("You have 90 days from today to ask for a hearing.", src)).toEqual(["today"]);
    expect(newTimeAnchors("You have 90 days from the date of this notice.", src)).toEqual([]);
  });
  it("allows time words the letter itself uses", () => {
    expect(newTimeAnchors("Coverage stops next month.", "Your coverage will stop at the end of next month.")).toEqual([]);
  });
});

describe("already-happened guard", () => {
  it("blocks past tense the letter does not use", () => {
    const src = "Your Medical Assistance (Medicaid) coverage will end on November 30, 2026.";
    expect(newDoneWords("We ended your coverage.", src)).toEqual(["ended"]);
    expect(newDoneWords("Your coverage will end on November 30, 2026.", src)).toEqual([]);
  });
});

describe("dates", () => {
  it("only returns dates printed on the page, never relative phrases", () => {
    const doc = "Notice Date: October 26, 2026. Ask within 10 days of the date of this notice. Coverage ends tomorrow.";
    const d = findDates(doc, new Date(2026, 9, 28));
    expect(d.map((x) => x.iso)).toEqual(["2026-10-26"]);
  });
  it("computes calendar-day deadlines from the notice date", () => {
    const [r] = findRelativeDeadlines("If you ask for a hearing within 10 days of the date of this notice, benefits continue.");
    const c = computeRelative(r, "2026-10-26", "October 26, 2026");
    expect(c.iso).toBe("2026-11-05");
    expect(c.conservative).toBe(false);
  });
  it("counts business days and marks them conservative", () => {
    expect(addBusinessDays("2026-10-30", 10)).toBe("2026-11-13");
    const [r] = findRelativeDeadlines("within ten (10) business days of the date of this notice");
    expect(r.count).toBe(10);
    expect(r.unit).toBe("business");
    expect(computeRelative(r, "2026-10-30", "October 30, 2026").conservative).toBe(true);
  });
  it("treats receipt-based deadlines as conservative", () => {
    const [r] = findRelativeDeadlines("within 15 days of the date you receive this notice");
    expect(r.anchor).toBe("receipt");
  });
  it("days until is whole days", () => {
    expect(daysUntil("2026-11-05", new Date(2026, 9, 28, 23, 59))).toBe(8);
  });
});

describe("citations and allowlist", () => {
  it("finds CFR, USC, and local policy citations", () => {
    const c = findCitations("Under 34 CFR 300.503(b) and 20 U.S.C. § 1415, and Board Policy 6164.4.");
    expect(c.map((x) => x.kind)).toEqual(["cfr", "usc", "other"]);
    expect(c[0].section).toBe("300.503");
  });
  it("allowlist matches exact domains and subdomains only", () => {
    expect(hostAllowed("https://www.ecfr.gov/current/title-34", ["ecfr.gov"])).toBe(true);
    expect(hostAllowed("https://ecfr.gov.evil.com/x", ["ecfr.gov"])).toBe(false);
    expect(hostAllowed("https://notecfr.gov/x", ["ecfr.gov"])).toBe(false);
  });
});

describe("rule packs", () => {
  it("detects each sample's notice type", () => {
    for (const s of SAMPLES) expect(detectPack(s.text).id).toBe(s.packId);
  });
  it("every element and clock rule points to a declared source", () => {
    for (const p of PACKS) {
      const ids = new Set(p.sources.map((s) => s.id));
      for (const e of p.elements) expect(ids.has(e.sourceId)).toBe(true);
      for (const c of p.clock) expect(ids.has(c.sourceId)).toBe(true);
    }
  });
});

describe("reply", () => {
  it("contains only template text, verified quotes, and blanks", () => {
    const pack = getPack("medicaid-adverse")!;
    const doc = SAMPLES[1].text;
    const sentences = splitSentences(doc);
    const action = sentences.findIndex((s) => s.text.includes("coverage will end"));
    const reply = buildReply({
      pack,
      sentences,
      noticeDateText: "October 26, 2026",
      elements: pack.elements.map((e) => ({
        id: e.id, label: e.label, plain: e.plain, cite: e.cite, sourceQuote: e.sourceQuote, sourceUrl: "", ask: e.ask,
        status: e.id === "regulations" ? "missing" : "found", sentenceIds: e.id === "action" ? [action] : [],
      })),
    });
    // Every quoted span in the reply is a real sentence from the letter.
    for (const m of reply.matchAll(/"([^"]+)"/g)) expect(findSpan(doc, m[1])).not.toBeNull();
    expect(reply).toContain("(42 CFR 431.210(c))");
    expect(reply).toContain("[YOUR NAME]");
  });
});

describe("readability", () => {
  it("scores dense legal text higher than plain text", () => {
    const plain = readability("We will stop your food help on May 1. You can ask for a hearing. Call us.");
    const dense = readability(
      "Pursuant to applicable regulatory determinations, the agency's eligibility redetermination necessitates discontinuation of supplemental nutritional assistance benefits notwithstanding any administrative reconsideration.",
    );
    expect(dense.grade).toBeGreaterThan(plain.grade + 6);
  });
});
