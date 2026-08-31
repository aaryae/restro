const TENANT_BASE_DOMAIN = String(
  import.meta.env.VITE_TENANT_BASE_DOMAIN || "",
)
  .trim()
  .toLowerCase()
  .replace(/^\.+|\.+$/g, "");

const POS_FALLBACK = String(
  import.meta.env.VITE_POS_URL || "http://localhost:7001",
).replace(/\/$/, "");

/** Public POS link for a cafe slug (production subdomain vs local ?tenant=). */
export function cafePosUrl(slug: string): string {
  const s = String(slug || "")
    .trim()
    .toLowerCase();
  if (!s) return POS_FALLBACK;
  if (import.meta.env.PROD && TENANT_BASE_DOMAIN) {
    return `https://${s}.${TENANT_BASE_DOMAIN}/`;
  }
  return `${POS_FALLBACK}/?tenant=${encodeURIComponent(s)}`;
}
