import type { MetadataRoute } from "next";
import { asset } from "@/lib/asset";

// Required for output:'export' — the manifest must be statically generated.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return {
    name: "TankKoll – håll koll på din bränsleförbrukning",
    short_name: "TankKoll",
    description:
      "Logga tankningar, räkna ut verklig förbrukning och jämför mot WLTP. Gratis, offline och all data stannar hos dig.",
    lang: "sv",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    orientation: "portrait-primary",
    icons: [
      { src: asset("/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
      { src: asset("/icons/icon-512.png"), sizes: "512x512", type: "image/png" },
      {
        src: asset("/icons/icon-maskable-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
