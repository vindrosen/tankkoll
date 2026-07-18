import type { Metadata } from "next";
import StatisticsView from "@/views/StatisticsView";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Statistik",
  description:
    "Snittförbrukning, kostnad per mil, månadsgrafer och jämförelse mot bilens officiella WLTP-förbrukning.",
  alternates: { canonical: absoluteUrl("/statistik/") },
};

export default function Page() {
  return <StatisticsView />;
}
