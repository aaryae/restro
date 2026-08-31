import { jwtDecode } from "jwt-decode";
import { getToken } from "./tokenHandler";

const STORAGE_KEY = "tenantSlug";

/** Platform / infra hosts that must never be treated as a cafe slug. */
const RESERVED_HOST_LABELS = new Set([
  "cafe",
  "admin",
  "www",
  "api",
  "serveapi",
  "pos",
  "platform",
  "mail",
  "status",
  "static",
  "web",
  "serve",
  "app",
  "staging",
  "dev",
  "test",
  "demo",
  "support",
  "help",
  "billing",
  "dashboard",
]);

function isPrivateLanHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^192\.168\.\d+\.\d+$/.test(hostname) ||
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)
  );
}

/**
 * Production: rajacafe.technirvana.com.np → "rajacafe".
 * Dev/LAN: returns null (use ?tenant= instead).
 */
function getTenantSlugFromHost(): string | null {
  if (typeof window === "undefined") return null;
  // Vite production builds (Docker) enable subdomain tenants.
  if (!import.meta.env.PROD) return null;

  const host = window.location.hostname.toLowerCase();
  if (isPrivateLanHost(host)) return null;

  const parts = host.split(".").filter(Boolean);
  // slug.technirvana.com.np → 4 labels; apex technirvana.com.np → 3
  if (parts.length < 4) return null;

  const label = parts[0];
  if (!label || RESERVED_HOST_LABELS.has(label)) return null;
  return label;
}

/** Prefer ?tenant= (dev), then production subdomain, then localStorage. */
function captureTenantFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("tenant")?.trim().toLowerCase();
  if (fromQuery) {
    localStorage.setItem(STORAGE_KEY, fromQuery);
    return;
  }
  if (params.get("tenant") === "") {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const fromHost = getTenantSlugFromHost();
  if (fromHost) {
    localStorage.setItem(STORAGE_KEY, fromHost);
  }
}

function getTenantBaseDomain(): string | null {
  const fromEnv = String(import.meta.env.VITE_TENANT_BASE_DOMAIN || "")
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, "");
  if (fromEnv) return fromEnv;

  if (typeof window === "undefined") return null;
  const parts = window.location.hostname.toLowerCase().split(".").filter(Boolean);
  if (parts.length < 4) return null;
  return parts.slice(1).join(".");
}

function getJwtTenantSlug(): string | null {
  const token = getToken("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode<{ slug?: string }>(token);
    const slug = decoded?.slug?.trim().toLowerCase();
    return slug || null;
  } catch {
    return null;
  }
}

/**
 * Production: pos.technirvana.com.np is a shared host — send users to
 * https://{slug}.technirvana.com.np/ once we know their tenant (JWT / ?tenant=).
 */
function redirectToTenantSubdomainIfNeeded(): boolean {
  if (!import.meta.env.PROD || typeof window === "undefined") return false;

  captureTenantFromUrl();

  const host = window.location.hostname.toLowerCase();
  const parts = host.split(".").filter(Boolean);
  if (parts.length < 4) return false;

  const label = parts[0];
  if (!label || !RESERVED_HOST_LABELS.has(label)) return false;

  const jwtSlug = getJwtTenantSlug();
  const storedSlug = localStorage.getItem(STORAGE_KEY)?.trim().toLowerCase() || null;
  const slug = jwtSlug || storedSlug;
  if (!slug || RESERVED_HOST_LABELS.has(slug)) return false;

  localStorage.setItem(STORAGE_KEY, slug);

  const base = getTenantBaseDomain();
  if (!base) return false;

  const targetHost = `${slug}.${base}`;
  if (targetHost === host) return false;

  const params = new URLSearchParams(window.location.search);
  params.delete("tenant");
  const search = params.toString();
  const target = `${window.location.protocol}//${targetHost}${window.location.pathname}${
    search ? `?${search}` : ""
  }${window.location.hash}`;
  window.location.replace(target);
  return true;
}

function getTenantSlug(): string | null {
  captureTenantFromUrl();
  if (typeof window === "undefined") return null;

  const fromStorage = localStorage.getItem(STORAGE_KEY);
  if (fromStorage) return fromStorage;

  const jwtSlug = getJwtTenantSlug();
  if (jwtSlug) {
    localStorage.setItem(STORAGE_KEY, jwtSlug);
    return jwtSlug;
  }

  return null;
}

export {
  getTenantSlug,
  captureTenantFromUrl,
  getTenantSlugFromHost,
  redirectToTenantSubdomainIfNeeded,
};
