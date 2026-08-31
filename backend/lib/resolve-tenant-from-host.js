"use strict";

const jwt = require("jsonwebtoken");
const { RESERVED_SLUGS } = require("../constants/tenant-constants");
const { JWT_SECRET } = require("../configs/credentials");

/**
 * Pull the first subdomain label from Host / X-Forwarded-Host.
 * Examples:
 *   hillside.servecafe.app → hillside
 *   cafe.servecafe.app    → cafe
 *   localhost:8080        → null
 *   127.0.0.1:8080        → null
 */
function extractSubdomain(hostHeader) {
  if (!hostHeader || typeof hostHeader !== "string") return null;

  const host = hostHeader.split(",")[0].trim().split(":")[0].toLowerCase();

  if (
    host === "localhost" ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host === "::1"
  ) {
    return null;
  }

  const parts = host.split(".").filter(Boolean);
  // need at least subdomain.domain.tld
  if (parts.length < 3) return null;

  return parts[0] || null;
}

/** Soft-read Admin JWT for slug (used on cafe.* before auth middleware runs). */
function peekJwtSlug(req) {
  let token =
    req.headers.authorization ||
    req.headers["x-access-token"] ||
    req.headers.token ||
    "";
  if (typeof token !== "string" || !token.startsWith("Admin ")) return null;
  try {
    const decoded = jwt.verify(token.replace("Admin ", ""), JWT_SECRET);
    return decoded?.slug || null;
  } catch {
    return null;
  }
}

/**
 * Decide which slug this request should use.
 * Priority: X-Tenant-Slug (local/dev) → paid subdomain → JWT slug (cafe / fallback).
 */
function resolveTenantSlug(req) {
  const headerSlug = (req.headers["x-tenant-slug"] || "")
    .toString()
    .trim()
    .toLowerCase();
  if (headerSlug) {
    if (RESERVED_SLUGS.includes(headerSlug)) return null;
    return headerSlug;
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const subdomain = extractSubdomain(host);

  if (subdomain && !RESERVED_SLUGS.includes(subdomain)) {
    return subdomain;
  }

  // Reserved hosts (serveapi, platform, serve, …): tenant only from Admin JWT
  const jwtSlug = peekJwtSlug(req);
  if (jwtSlug) return jwtSlug;

  return null;
}

module.exports = {
  extractSubdomain,
  resolveTenantSlug,
  peekJwtSlug,
};
