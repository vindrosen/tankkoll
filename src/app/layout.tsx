import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";
import { SwRegistrar } from "@/components/SwRegistrar";
import { asset } from "@/lib/asset";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const description =
  "TankKoll hjälper dig logga tankningar, räkna ut verklig bränsleförbrukning, jämföra mot WLTP och följa dina bränslekostnader över tid. Gratis och all data stannar i din webbläsare.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TankKoll – håll koll på din bränsleförbrukning",
    template: "%s – TankKoll",
  },
  description,
  applicationName: SITE_NAME,
  keywords: [
    "bränsleförbrukning",
    "tankningar",
    "bensinpriser",
    "bränslekostnad",
    "l/100 km",
    "WLTP",
    "bilkostnader",
  ],
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    title: "TankKoll – håll koll på din bränsleförbrukning",
    description,
    locale: "sv_SE",
    images: [
      {
        url: absoluteUrl("/images/og.jpg"),
        width: 1200,
        height: 630,
        alt: "TankKoll – bränslemätare och appnamn",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TankKoll – håll koll på din bränsleförbrukning",
    description,
    images: [absoluteUrl("/images/og.jpg")],
  },
  icons: {
    apple: asset("/icons/apple-touch-icon.png"),
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  description,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Any",
  inLanguage: "sv",
  offers: { "@type": "Offer", price: "0", priceCurrency: "SEK" },
  author: { "@type": "Person", name: "Robert Erlandsson", url: "https://erlandsson.online" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" data-theme="dark">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {process.env.NODE_ENV === "production" && (
          <script
            defer
            src="https://analytics.erlandsson.online/script.js"
            data-website-id="ab4f077e-1961-4726-b7b2-2819521e7ad7"
          />
        )}
        <AppShell>{children}</AppShell>
        <SwRegistrar />
      </body>
    </html>
  );
}
