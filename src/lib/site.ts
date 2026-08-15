/**
 * Origin the app is served from. The sub-path comes from
 * NEXT_PUBLIC_BASE_PATH — the same variable next.config.ts reads for
 * `basePath` — so canonical/OG URLs can never drift from the actual
 * build prefix.
 */
const ORIGIN = "https://everydayapps.se";

/** Canonical production URL (no trailing slash). */
export const SITE_URL = `${ORIGIN}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`;

export const SITE_NAME = "TankKoll";

/**
 * Absolute URL for canonical/OG tags. Relative paths would resolve
 * against the domain root and silently drop the /tankkoll basePath.
 */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
