"use strict";

const crypto = require("crypto");

/** One-time POS bootstrap codes (in-memory). TTL keeps URL exposure short. */
const TTL_MS = 90 * 1000;
const store = new Map();

function prune() {
  const now = Date.now();
  for (const [code, row] of store) {
    if (!row || row.expiresAt <= now) store.delete(code);
  }
}

/**
 * Store a POS JWT behind an opaque single-use code for URL handoff.
 * @returns {string} handoff code
 */
function createPosHandoff({ token, tenantSlug }) {
  prune();
  const code = crypto.randomBytes(32).toString("base64url");
  store.set(code, {
    token: String(token),
    tenantSlug: String(tenantSlug || "").toLowerCase(),
    expiresAt: Date.now() + TTL_MS,
  });
  return code;
}

/**
 * Consume a handoff code. Returns { token, tenantSlug } or null.
 */
function consumePosHandoff(code, expectedSlug) {
  prune();
  const key = String(code || "").trim();
  if (!key) return null;
  const row = store.get(key);
  store.delete(key);
  if (!row || row.expiresAt <= Date.now()) return null;
  if (
    expectedSlug &&
    row.tenantSlug &&
    row.tenantSlug !== String(expectedSlug).toLowerCase()
  ) {
    return null;
  }
  return { token: row.token, tenantSlug: row.tenantSlug };
}

module.exports = {
  createPosHandoff,
  consumePosHandoff,
  POS_HANDOFF_TTL_MS: TTL_MS,
};
