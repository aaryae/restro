"use strict";

const crypto = require("crypto");

/**
 * Envelope encryption for at-rest secrets (bank password, api/webhook token,
 * NPI signing key, etc.).
 *
 * - Algorithm: AES-256-GCM (authenticated encryption).
 * - Master key: APP_SECRET_ENCRYPTION_KEY (env/KMS), 32 bytes as base64 or hex.
 *   The key NEVER lives in the database; only the encrypted blobs do.
 * - Format: "v1:<base64 iv>:<base64 authTag>:<base64 ciphertext>".
 *   The "v1" prefix lets us rotate the master key / scheme later.
 */

const VERSION = "v1";
const ALGO = "aes-256-gcm";
const IV_BYTES = 12; // GCM standard nonce length
const KEY_BYTES = 32; // AES-256

let cachedKey = null;

function loadMasterKey() {
  if (cachedKey) return cachedKey;

  const raw = process.env.APP_SECRET_ENCRYPTION_KEY;
  if (!raw || !raw.trim()) {
    throw new Error(
      "APP_SECRET_ENCRYPTION_KEY is not set — cannot encrypt/decrypt integration secrets. " +
        "Generate one with: openssl rand -base64 32",
    );
  }

  const trimmed = raw.trim();
  let key;
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    key = Buffer.from(trimmed, "hex");
  } else {
    key = Buffer.from(trimmed, "base64");
  }

  if (key.length !== KEY_BYTES) {
    throw new Error(
      `APP_SECRET_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes (got ${key.length}). ` +
        "Generate one with: openssl rand -base64 32",
    );
  }

  cachedKey = key;
  return cachedKey;
}

/** True when a value looks like a secret-box blob we produced. */
function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(`${VERSION}:`);
}

/** Encrypt a UTF-8 string. Returns null for empty/nullish input. */
function encrypt(plain) {
  if (plain === undefined || plain === null || plain === "") {
    return null;
  }
  const key = loadMasterKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(plain), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/** Decrypt a secret-box blob back to its UTF-8 string. Returns null for empty input. */
function decrypt(blob) {
  if (blob === undefined || blob === null || blob === "") {
    return null;
  }
  if (!isEncrypted(blob)) {
    throw new Error("secret-box: value is not in the expected v1 format");
  }
  const [, ivB64, tagB64, ctB64] = blob.split(":");
  if (!ivB64 || !tagB64 || !ctB64) {
    throw new Error("secret-box: malformed encrypted value");
  }
  const key = loadMasterKey();
  const decipher = crypto.createDecipheriv(
    ALGO,
    key,
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/** Throws early (e.g. at startup or on save) if the master key is unusable. */
function assertMasterKeyUsable() {
  loadMasterKey();
  return true;
}

module.exports = {
  encrypt,
  decrypt,
  isEncrypted,
  assertMasterKeyUsable,
};
