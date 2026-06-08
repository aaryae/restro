"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { config } = require("../config");

function resolvePfxPath() {
  const pfxPath = config.pfxPath;
  if (!pfxPath) return pfxPath;
  return path.isAbsolute(pfxPath)
    ? pfxPath
    : path.resolve(process.cwd(), pfxPath);
}

/** PFX used only for QR token signing (may differ from mTLS client cert PFX). */
function resolveQrSigningPfxPath() {
  const pfxPath = config.qrSigningPfxPath || config.pfxPath;
  if (!pfxPath) return pfxPath;
  return path.isAbsolute(pfxPath)
    ? pfxPath
    : path.resolve(process.cwd(), pfxPath);
}

function qrTokenSigningSource() {
  if (usesQrPrivateKeyFile()) return "MACHBANK_QR_PRIVATE_KEY_PATH";
  if (config.qrSigningPfxPath) return "MACHBANK_QR_SIGNING_PFX_PATH";
  return "MACHBANK_PFX_PATH";
}

function resolveQrPrivateKeyPath() {
  const keyPath = config.qrPrivateKeyPath;
  if (!keyPath) return keyPath;
  return path.isAbsolute(keyPath)
    ? keyPath
    : path.resolve(process.cwd(), keyPath);
}

function usesQrPrivateKeyFile() {
  const keyPath = resolveQrPrivateKeyPath();
  return Boolean(keyPath && fs.existsSync(keyPath));
}

/**
 * Machbank / NCHL — same as buildSignatureString(request, userId).
 * @param {object} request - generateQR payload (MerchantQrGenerationRequestPayload)
 * @param {string} userId - NPI user id (MACHBANK_NPI_USER_ID)
 */
function buildSignatureString(request, userId) {
  const uid = userId || config.npiUserId;
  if (!uid) {
    throw new Error(
      "NPI userId required for QR token — set MACHBANK_NPI_USER_ID (not the same as MACHBANK_USERNAME)",
    );
  }
  const signatureString = [
    request.acquirerId,
    request.merchantId,
    request.merchantCategoryCode,
    request.transactionCurrency,
    request.transactionAmount,
    request.billNumber,
    uid,
  ].join(",");

  return signatureString;
}

function buildSignatureStringFromBody(body, userId) {
  return buildSignatureString(body, userId);
}

function formatAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) {
    return "0.00";
  }
  return n.toFixed(2);
}

/** Strip openssl pkcs12 metadata (Bag Attributes) — keep only the PEM block. */
function extractPrivateKeyPemBlock(keyData) {
  const trimmed = String(keyData || "").trim();
  const match = trimmed.match(
    /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA )?PRIVATE KEY-----/,
  );
  return match ? match[0] : trimmed;
}

/**
 * Machbank getPrivateKey — normalizes raw base64 to PKCS#8 PEM; passes through full PEM files.
 */
function getPrivateKey(keyData) {
  if (!keyData || keyData.trim() === "") {
    throw new Error("private key is missing .....");
  }

  const trimmed = extractPrivateKeyPemBlock(keyData);
  if (trimmed.includes("BEGIN")) {
    return trimmed;
  }

  const privateKeyPEM = trimmed
    .replace("-----BEGIN RSA PRIVATE KEY-----", "")
    .replace("-----END RSA PRIVATE KEY-----", "")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\r\n/g, "")
    .replace(/\n/g, "")
    .replace(/\s/g, "")
    .trim();

  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(privateKeyPEM)) {
    throw new Error("private key is not valid");
  }

  return `-----BEGIN PRIVATE KEY-----\n${privateKeyPEM}\n-----END PRIVATE KEY-----`;
}

function signingPublicKeyFingerprintSha256(privateKeyPem) {
  try {
    const pub = crypto.createPublicKey(privateKeyPem).export({
      type: "spki",
      format: "der",
    });
    return crypto.createHash("sha256").update(pub).digest("hex");
  } catch {
    return null;
  }
}

function loadQrPrivateKeyRaw() {
  const keyPath = resolveQrPrivateKeyPath();
  if (!keyPath) {
    throw new Error("MACHBANK_QR_PRIVATE_KEY_PATH is not set");
  }
  if (!fs.existsSync(keyPath)) {
    throw new Error(`QR private key file not found: ${keyPath}`);
  }
  return fs.readFileSync(keyPath, "utf8");
}

function loadPrivateKeyPemFromPfx() {
  const pfxPath = resolveQrSigningPfxPath();

  if (!pfxPath) {
    throw new Error(
      config.qrSigningPfxPath
        ? "MACHBANK_QR_SIGNING_PFX_PATH is not set"
        : "MACHBANK_PFX_PATH is not set",
    );
  }
  if (!fs.existsSync(pfxPath)) {
    throw new Error(`PFX file not found: ${pfxPath}`);
  }

  const pass = config.qrSigningPfxPassphrase || config.pfxPassphrase || "";
  const passin = pass ? `pass:${pass}` : "pass:";

  const result = spawnSync(
    "openssl",
    [
      "pkcs12",
      "-legacy",
      "-in",
      pfxPath,
      "-nocerts",
      "-nodes",
      "-passin",
      passin,
    ],
    { encoding: "utf8", maxBuffer: 1024 * 1024 },
  );

  if (result.status !== 0 || !result.stdout) {
    const detail = result.stderr || "openssl pkcs12 failed";
    throw new Error(
      `Failed to read signing key from PFX (openssl pkcs12): ${detail}`,
    );
  }

  return extractPrivateKeyPemBlock(result.stdout);
}

/** Same entry for PEM file or PFX extract — then getPrivateKey + signSHA256RSA. */
function loadSigningKeyMaterial() {
  if (usesQrPrivateKeyFile()) {
    return loadQrPrivateKeyRaw();
  }
  return loadPrivateKeyPemFromPfx();
}

/** PEM string used for signing (normalized via getPrivateKey). */
function loadSigningPrivateKeyPem() {
  return getPrivateKey(loadSigningKeyMaterial());
}

function extractPublicKeyPemFromPfx(pfxPath, passphrase) {
  if (!pfxPath || !fs.existsSync(pfxPath)) {
    return null;
  }

  const pass = passphrase || "";
  const passin = pass ? `pass:${pass}` : "pass:";

  const result = spawnSync(
    "openssl",
    [
      "pkcs12",
      "-legacy",
      "-in",
      pfxPath,
      "-clcerts",
      "-nokeys",
      "-passin",
      passin,
    ],
    { encoding: "utf8", maxBuffer: 1024 * 1024 },
  );

  if (result.status !== 0 || !result.stdout) {
    return null;
  }

  return result.stdout;
}

function loadQrSigningPublicKeyPem() {
  const pfxPath = resolveQrSigningPfxPath();
  const pass = config.qrSigningPfxPassphrase || config.pfxPassphrase || "";
  return extractPublicKeyPemFromPfx(pfxPath, pass);
}

function loadPublicKeyPemForVerify() {
  if (usesQrPrivateKeyFile()) {
    try {
      const privateKeyPem = loadSigningPrivateKeyPem();
      return crypto.createPublicKey(privateKeyPem).export({
        type: "spki",
        format: "pem",
      });
    } catch (err) {
      return null;
    }
  }
  return loadQrSigningPublicKeyPem();
}

/**
 * NCHL "PROCESS TO GENERATE TOKEN" (Merchant QR introduction):
 *   i.   SHA256 message digest of the token string (UTF-8)
 *   ii.  Sign using the PFX/keystore private key with SHA256withRSA
 *   iii. Base64-encode the signature bytes
 *   iv.  Caller assigns the result to the request `token` field
 *
 * SHA256withRSA is RSASSA-PKCS1-v1_5 with a SHA-256 DigestInfo prefix.
 * Node's createSign("RSA-SHA256") performs steps i+ii in one call (same as Java Signature SHA256withRSA).
 *
 * @param {string} tokenString - comma-separated fields from buildSignatureString()
 * @param {string} privateKeyPem - normalized PEM private key (from PFX via openssl pkcs12, or PEM file)
 * @returns {string} base64 signature for the `token` field
 */
function signNchlTokenSteps(tokenString, privateKeyPem) {
  // i + ii: hash token string with SHA-256, RSA-sign digest (SHA256withRSA)
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(tokenString, "utf8");
  signer.end();
  const signatureBytes = signer.sign(privateKeyPem);
  // iii: base64-encode signed token
  return signatureBytes.toString("base64");
}

/**
 * Full NCHL token pipeline: PFX private key → sign → base64 `token` value.
 * @param {string} tokenString
 * @param {string} [privateKeyString] - optional PEM material override (tests); default loads from PFX
 */
function signSHA256RSA(tokenString, privateKeyString) {
  try {
    const material =
      privateKeyString !== undefined && privateKeyString !== null
        ? privateKeyString
        : loadSigningKeyMaterial();
    const privateKeyPem = getPrivateKey(material);
    return signNchlTokenSteps(tokenString, privateKeyPem);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Token generation failed: ${message}`);
  }
}

function signQrRequestToken(tokenString) {
  return signSHA256RSA(tokenString);
}

function verifyQrTokenLocally(tokenString, tokenBase64) {
  const publicKeyPem = loadPublicKeyPemForVerify();
  if (!publicKeyPem || !tokenBase64) {
    return { ok: false, reason: "missing_public_key_or_token" };
  }
  try {
    const ok = crypto
      .createVerify("RSA-SHA256")
      .update(tokenString, "utf8")
      .verify(publicKeyPem, tokenBase64, "base64");
    return {
      ok,
      reason: ok
        ? usesQrPrivateKeyFile()
          ? "signature_matches_local_pem"
          : "signature_matches_local_pfx"
        : "signature_mismatch",
    };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

function buildSignedQrTokenFromRequest(request, userId) {
  const tokenString = buildSignatureString(request, userId);
  // NCHL steps i–iii via signSHA256RSA (PFX keystore); step iv below
  const token = signSHA256RSA(tokenString);
  if (!token) {
    throw new Error(
      usesQrPrivateKeyFile()
        ? "QR token signing produced empty value — check MACHBANK_QR_PRIVATE_KEY_PATH"
        : "QR token signing produced empty value — check MACHBANK_PFX_PATH and MACHBANK_PFX_PASSPHRASE",
    );
  }
  const localVerify = verifyQrTokenLocally(tokenString, token);
  // iv: `token` is set on the generateQR body in nepalpay-qr-spec.js
  return { token, tokenString, localVerify };
}

function buildSignedQrTokenFromBody(body, userId) {
  return buildSignedQrTokenFromRequest(body, userId);
}

module.exports = {
  buildSignatureString,
  buildSignatureStringFromBody,
  buildSignedQrTokenFromRequest,
  buildSignedQrTokenFromBody,
  formatAmount,
  getPrivateKey,
  signNchlTokenSteps,
  signSHA256RSA,
  signQrRequestToken,
  verifyQrTokenLocally,
  resolvePfxPath,
  resolveQrSigningPfxPath,
  resolveQrPrivateKeyPath,
  qrTokenSigningSource,
  usesQrPrivateKeyFile,
  signingPublicKeyFingerprintSha256,
  loadSigningPrivateKeyPem,
  loadPrivateKeyPemFromPfx,
};
