"use strict";

/**
 * Production cafe POS URLs use https://{slug}.{TENANT_BASE_DOMAIN}/
 * Dev / LAN keep a single POS host with ?tenant={slug}.
 */
function isProductionEnv() {
  const env = String(process.env.ENV || process.env.NODE_ENV || "").toLowerCase();
  return env === "production";
}

function isLocalishHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^192\.168\.\d+\.\d+$/.test(hostname) ||
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)
  );
}

function isLocalishUrl(url) {
  try {
    const { hostname } = new URL(url);
    return isLocalishHost(hostname);
  } catch {
    return false;
  }
}

function requestOrigin(req) {
  return String(req?.get?.("origin") || req?.headers?.origin || "").trim();
}

function isLocalishRequest(req) {
  const origin = requestOrigin(req);
  return origin ? isLocalishUrl(origin) : false;
}

function tenantBaseDomain() {
  return String(process.env.TENANT_BASE_DOMAIN || "")
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, "");
}

function useSubdomainPosUrls(req) {
  if (isLocalishRequest(req)) return false;
  return isProductionEnv() && Boolean(tenantBaseDomain());
}

function posPublicUrl(req) {
  const origin = requestOrigin(req);
  if (origin && isLocalishUrl(origin)) {
    try {
      const u = new URL(origin);
      u.port = process.env.POS_PUBLIC_PORT || "7001";
      return u.origin;
    } catch {
      /* fall through */
    }
  }

  const configured =
    process.env.POS_PUBLIC_URL || process.env.ADMIN_PUBLIC_URL || "";
  if (configured) {
    const clean = configured.replace(/\/$/, "");
    if (isLocalishUrl(clean)) {
      return clean;
    }
    if (isProductionEnv() && !isLocalishRequest(req)) {
      return clean;
    }
  }

  return "http://localhost:7001";
}

function cafePosOrigin(slug) {
  const base = tenantBaseDomain();
  const protocol = process.env.TENANT_POS_PROTOCOL || "https";
  return `${protocol}://${String(slug).toLowerCase()}.${base}`;
}

function buildPosBootstrapUrl(slug, token, req) {
  const hash = `#pos_token=${encodeURIComponent(token)}`;
  if (useSubdomainPosUrls(req)) {
    return `${cafePosOrigin(slug)}/${hash}`;
  }
  return `${posPublicUrl(req)}/?tenant=${encodeURIComponent(slug)}${hash}`;
}

function cafePublicUrl(slug, req) {
  if (useSubdomainPosUrls(req)) {
    return `${cafePosOrigin(slug)}/`;
  }
  return `${posPublicUrl(req)}/?tenant=${encodeURIComponent(slug)}`;
}

/** Allow https://*.TENANT_BASE_DOMAIN (and apex) in production CORS. */
function isTenantBaseOrigin(origin) {
  const base = tenantBaseDomain();
  if (!base || !origin) return false;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "https:" && protocol !== "http:") return false;
    return hostname === base || hostname.endsWith(`.${base}`);
  } catch {
    return false;
  }
}

module.exports = {
  isProductionEnv,
  isLocalishHost,
  isLocalishRequest,
  tenantBaseDomain,
  useSubdomainPosUrls,
  posPublicUrl,
  cafePosOrigin,
  buildPosBootstrapUrl,
  cafePublicUrl,
  isTenantBaseOrigin,
};
