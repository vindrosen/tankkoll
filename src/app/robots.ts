import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Required for output:'export' — robots.txt must be statically generated.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
