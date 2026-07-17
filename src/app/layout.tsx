import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TankKoll – håll koll på din bränsleförbrukning",
    template: "%s – TankKoll",
  },
  description:
    "TankKoll hjälper dig logga tankningar, räkna ut verklig bränsleförbrukning, jämföra mot WLTP och följa dina bränslekostnader över tid. Gratis och all data stannar i din webbläsare.",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" data-theme="dark">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
