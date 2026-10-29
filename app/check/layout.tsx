import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check a letter",
  description: "Upload or paste a school, Medicaid, or SNAP notice. Get the real deadline, what the law requires that is missing, and a reply.",
};

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return children;
}
