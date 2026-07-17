import type { Metadata } from "next";
import SettingsView from "@/views/SettingsView";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Inställningar",
  description:
    "Valuta, tema, export och import av din data i TankKoll. All data sparas lokalt i din webbläsare.",
  alternates: { canonical: absoluteUrl("/installningar/") },
};

export default function Page() {
  return <SettingsView />;
}
