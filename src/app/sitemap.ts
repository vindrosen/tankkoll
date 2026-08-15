import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Required for output:'export' — the sitemap must be statically generated.
export const dynamic = "force-static";

const ROUTES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1.0 },
  { path: "/tankning/", priority: 0.8 },
  { path: "/tankningar/", priority: 0.7 },
  { path: "/statistik/", priority: 0.7 },
  { path: "/bilar/", priority: 0.6 },
  { path: "/installningar/", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(({ path, priority }) => ({
    url: absoluteUrl(path),
    priority,
  }));
}
