import type { Metadata } from "next";
import RefuelingsView from "@/views/RefuelingsView";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tankningar",
  description:
    "Hela din tankningshistorik – körsträcka, förbrukning och kostnad per tankning. Redigera eller ta bort poster när som helst.",
  alternates: { canonical: absoluteUrl("/tankningar/") },
};

export default function Page() {
  return <RefuelingsView />;
}
