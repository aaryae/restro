import { IMAGE_BASE_URL } from "@/constants";

/**
 * Build a full URL for files stored under backend /resources (e.g. resources/foo.png).
 */
export function buildAssetUrl(path?: string | null): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }
  const base = (IMAGE_BASE_URL || "").replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
