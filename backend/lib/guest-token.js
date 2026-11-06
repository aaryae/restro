"use strict";

const crypto = require("crypto");

function createGuestToken() {
  return crypto.randomBytes(24).toString("base64url");
}

function isGuestTokenShape(token) {
  if (typeof token !== "string") return false;
  const trimmed = token.trim();
  return trimmed.length >= 16 && trimmed.length <= 64 && /^[A-Za-z0-9_-]+$/.test(trimmed);
}

module.exports = {
  createGuestToken,
  isGuestTokenShape,
};
