/** Canonical production URL (no trailing slash). */
export const SITE_URL = "https://erlandsson.online/tankkoll";

export const SITE_NAME = "TankKoll";

/**
 * Absolute URL for canonical/OG tags. Relative paths would resolve
 * against the domain root and silently drop the /tankkoll basePath.
 */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
