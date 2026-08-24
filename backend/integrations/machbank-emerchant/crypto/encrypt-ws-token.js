"use strict";

const crypto = require("crypto");
const { config } = require("../config");
const logger = require("../../../configs/logger");

/**
 * Encrypt the nqrws api_token with NCHL's public key.
 * Spec requires "RSA/ECB/PKCS1Padding" == crypto.publicEncrypt + RSA_PKCS1_PADDING.
 *
 * The key is provided by NCHL/Machbank. We default to the getpay public key but
 * allow a dedicated MACHBANK_WS_TOKEN_PUBLIC_KEY(_PATH) when the bank uses a
 * separate key for websocket token encryption.
 */

let cachedKey = null;
let cachedKeyError = null;

/** Clear the cached WS-token public key so the next call rebuilds from config. */
function resetWsTokenKey() {
  cachedKey = null;
  cachedKeyError = null;
}

function loadPublicKey() {
  if (cachedKey || cachedKeyError) {
    return cachedKey;
  }
  const pem = config.wsTokenPublicKey || config.getpayPublicKey;
  if (!pem) {
    cachedKeyError = new Error("nqrws token public key not configured");
    return null;
  }
  try {
    cachedKey = crypto.createPublicKey(pem);
  } catch (err) {
    cachedKeyError = err;
    cachedKey = null;
  }
  return cachedKey;
}

/** True when a usable RSA public key is available for token encryption. */
function canEncryptWsToken() {
  return Boolean(loadPublicKey());
}

function encryptWsToken(token) {
  const key = loadPublicKey();
  if (!key) {
    throw new Error(
      `nqrws token public key invalid or missing: ${cachedKeyError?.message || "unknown"}`,
    );
  }
  return crypto
    .publicEncrypt(
      { key, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(token, "utf8"),
    )
    .toString("base64");
}

/** Startup diagnostic — logs a clear, actionable error when the key is unusable. */
function assertWsTokenKeyUsable() {
  if (canEncryptWsToken()) return true;
  logger.error(
    "[Machbank] nqrws token public key is invalid/corrupted — websocket settlement will fail " +
      "with 'Token decryption failed'. Re-request the NepalPAY QR websocket public key from Machbank/NCHL " +
      "and set MACHBANK_WS_TOKEN_PUBLIC_KEY_PATH (or fix MACHBANK_GETPAY_PUBLIC_KEY_PATH).",
  );
  return false;
}

module.exports = {
  encryptWsToken,
  canEncryptWsToken,
  assertWsTokenKeyUsable,
  resetWsTokenKey,
};
