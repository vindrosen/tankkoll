import type { Metadata } from "next";
import VehiclesView from "@/views/VehiclesView";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bilar",
  description:
    "Hantera dina bilar i TankKoll – flera fordon, WLTP-jämförelse och automatisk förbrukningsberäkning per bil.",
  alternates: { canonical: absoluteUrl("/bilar/") },
};

export default function Page() {
  return <VehiclesView />;
}
