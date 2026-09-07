import type { Metadata } from "next";
import { KontaktFormular } from "@/components/KontaktFormular";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Samarbeten, förbättringsförslag, felrapporter eller annat – skriv några rader, eller mejla direkt.",
  alternates: { canonical: absoluteUrl("/kontakt/") },
};

export default function Page() {
  return <KontaktFormular slug="tankkoll" />;
}
