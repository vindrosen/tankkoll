/**
 * Prefixes static asset paths with the configured basePath.
 * next/image and plain src attributes do NOT get basePath applied
 * automatically in a static export, so every local image src must
 * go through this helper.
 */
export function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
