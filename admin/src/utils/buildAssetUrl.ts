import { IMAGE_BASE_URL } from "@/constants";

/**
 * Build a full URL for files stored under backend /resources (e.g. resources/foo.png).
 */
export function buildAssetUrl(path?: string | null): string {
  if (!path || path === "null" || path === "undefined") return "";

  const trimmed = String(path).trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }

  const base = (IMAGE_BASE_URL || "").replace(/\/$/, "");
  if (!base) return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  // Avoid doubling if the path already starts with the base URL
  if (trimmed.startsWith(base)) return trimmed;

  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${normalized}`;
}
