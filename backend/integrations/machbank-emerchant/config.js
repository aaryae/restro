"use strict";

const fs = require("fs");
const path = require("path");
const { isProduction } = require("../../utils/app-env");
const {
  CONFIG_CODES,
  MachbankConfigError,
  logMachbankIssue,
} = require("./errors");

/** Read env var; no fallbacks for mandatory bank settings. */
function env(name) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    return undefined;
  }
  return value.trim();
}

function envInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/** ISO 4217 numeric codes for supported currencies. */
const CURRENCY_ISO_NUMERIC = {
  NPR: 524,
};

/** MACHBANK_CURRENCY=NPR or numeric 524 (ISO 4217 for NPR). */
function resolveCurrencyCode() {
  const raw = env("MACHBANK_CURRENCY");
  if (!raw) {
    return envInt("MACHBANK_CURRENCY_CODE", 524);
  }
  if (CURRENCY_ISO_NUMERIC[raw] != null) {
    return CURRENCY_ISO_NUMERIC[raw];
  }
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }
  return envInt("MACHBANK_CURRENCY_CODE", 524);
}

function resolveSecretPath(filePath) {
  if (!filePath) return filePath;
  return path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
}

function secretFileExists(filePath) {
  const resolved = resolveSecretPath(filePath);
  return Boolean(resolved && fs.existsSync(resolved));
}

function readPublicKey() {
  const keyPath = env("MACHBANK_GETPAY_PUBLIC_KEY_PATH");
  if (keyPath && secretFileExists(keyPath)) {
    return fs.readFileSync(resolveSecretPath(keyPath), "utf8");
  }
  return env("MACHBANK_GETPAY_PUBLIC_KEY");
}

/** Public key for encrypting the nqrws api_token (RSA/ECB/PKCS1Padding). */
function readWsTokenPublicKey() {
  const keyPath = env("MACHBANK_WS_TOKEN_PUBLIC_KEY_PATH");
  if (keyPath && secretFileExists(keyPath)) {
    return fs.readFileSync(resolveSecretPath(keyPath), "utf8");
  }
  return env("MACHBANK_WS_TOKEN_PUBLIC_KEY") || undefined;
}

/**
 * nqrws `merchant_id` == the NEPALPAY merchant code (e.g. 1501KQZRFMY) — the same
 * value sent as `merchantId` on generateQR. NCHL keys the websocket transaction
 * lookup off the merchant code, not the store/terminal label.
 * Override with MACHBANK_WS_MERCHANT_ID only if the bank explicitly says otherwise.
 */
function resolveWsMerchantId() {
  const explicit = env("MACHBANK_WS_MERCHANT_ID");
  if (explicit) return explicit;
  return resolveBankMid() || env("MACHBANK_MERCHANT_CODE") || undefined;
}

/** NEPALPAY merchant id (e.g. 1501KQZRFMY) — NCHL `merchantId` on generateQR and WS. */
function resolveBankMid() {
  return env("MACHBANK_MERCHANT_MID");
}

/** NPI user id for QR token string (field 7) — separate from MACHBANK_USERNAME / Basic auth. */
function resolveNpiUserId() {
  return env("MACHBANK_NPI_USER_ID");
}

/**
 * NCHL doc uses separate storeLabel + terminalLabel (e.g. Store1 / Terminal1).
 * Machbank packs sometimes use "Store1::Terminal1" as one terminal id — keep as-is unless split is enabled.
 */
function resolveQrStoreTerminalLabels() {
  const storeLabel =
    env("MACHBANK_STORE_LABEL") || "";
  const rawTerminal = env("MACHBANK_TERMINAL_LABEL") || "";

  if (
    process.env.MACHBANK_QR_SPLIT_TERMINAL_LABEL === "true" &&
    rawTerminal.includes("::")
  ) {
    const [storePart, terminalPart] = rawTerminal.split("::").map((s) => s.trim());
    return {
      storeLabel: storeLabel || storePart,
      terminalLabel: terminalPart || rawTerminal,
    };
  }

  return {
    storeLabel,
    terminalLabel: rawTerminal,
  };
}

const config = {
  enabled: process.env.MACHBANK_EMERCHANT_ENABLED === "true",

  baseUrl: env("MACHBANK_BASE_URL"),
  qrGenerateUrl: env("MACHBANK_QR_GENERATE_URL"),
  /** NEPALPAY transaction inquiry (optional; Machbank default path). */
  qrInquiryUrl:
    env("MACHBANK_QR_INQUIRY_URL") ||
    (env("MACHBANK_BASE_URL")
      ? `${env("MACHBANK_BASE_URL").replace(/\/$/, "")}/qr/transactionStatus`
      : undefined),
  wsUrl: env("MACHBANK_WS_URL"),

  bankMid: resolveBankMid(),
  merchantCode: env("MACHBANK_MERCHANT_CODE") || resolveBankMid(),
  merchantName: env("MACHBANK_MERCHANT_NAME"),
  acquirerId: env("MACHBANK_ACQUIRER_ID"),
  mcc: env("MACHBANK_MCC"),
  ...resolveQrStoreTerminalLabels(),
  merchantCity: env("MACHBANK_MERCHANT_CITY"),
  /** NCHL samples use 4600 for Kathmandu; override if bank gave another postal code. */
  merchantPostalCode: env("MACHBANK_MERCHANT_POSTAL_CODE") || "4600",
  npiUserId: resolveNpiUserId(),
  qrRequestImage: process.env.MACHBANK_QR_REQUEST_IMAGE !== "false",

  username: env("MACHBANK_USERNAME"),
  password: env("MACHBANK_PASSWORD"),
  wsUsername: env("MACHBANK_WS_USERNAME"),
  wsMerchantId: resolveWsMerchantId(),
  apiToken: env("MACHBANK_API_TOKEN"),

  getpayPublicKey: readPublicKey(),
  /** Key for encrypting the nqrws api_token; falls back to getpay key. */
  wsTokenPublicKey: readWsTokenPublicKey(),
  /** mTLS client cert + key PEM (alternative to MACHBANK_PFX_PATH). */
  tlsCertPath: env("MACHBANK_TLS_CERT_PATH"),
  tlsPrivateKeyPath: env("MACHBANK_TLS_PRIVATE_KEY_PATH"),
  /** Legacy: PKCS#12 bundle for mTLS (optional if TLS PEM paths are set). */
  pfxPath: env("MACHBANK_PFX_PATH"),
  pfxPassphrase: env("MACHBANK_PFX_PASSPHRASE"),
  /** QR token signing PEM (recommended). Falls back to PFX only when unset. */
  qrPrivateKeyPath: env("MACHBANK_QR_PRIVATE_KEY_PATH"),
  /** Optional NPI signing PFX (token only). Falls back to MACHBANK_PFX_PATH if unset. */
  qrSigningPfxPath: env("MACHBANK_QR_SIGNING_PFX_PATH"),
  qrSigningPfxPassphrase:
    env("MACHBANK_PFX_PASSPHRASE"),

  currency: env("MACHBANK_CURRENCY"),
  currencyCode: resolveCurrencyCode(),

  /** Reject WS settlement when getpay signature is missing (default: true). */
  requireGetpaySignature:
    process.env.MACHBANK_REQUIRE_GETPAY_SIGNATURE !== "false",

  /** Reject ambiguous WS payloads; align field names with bank PDF. */
  wsStrictParse: process.env.MACHBANK_WS_STRICT_PARSE !== "false",

  /**
   * Sandbox only: log redacted raw nqrws payloads to align parse-ws-event with bank PDF.
   * Ignored when NODE_ENV/ENV is production even if set true.
   */
  wsDebugLog:
    process.env.MACHBANK_WS_DEBUG_LOG === "true" && !isProduction(),

  // App tuning only (not bank endpoints); optional with safe defaults
  qrExpirySeconds: envInt("MACHBANK_QR_EXPIRY_SECONDS", 300),
  // Payer-facing remarks/purpose embedded in the QR (EMVCo tag 62-08).
  // Pre-filled so customers can just pay without typing remarks.
  qrPurpose: (process.env.MACHBANK_QR_PURPOSE || "Payment of food").trim(),
  httpTimeoutMs: envInt("MACHBANK_HTTP_TIMEOUT_MS", 15000),
  wsReconnectMaxMs: envInt("MACHBANK_WS_RECONNECT_MAX_MS", 60000),
  wsHeartbeatMs: envInt("MACHBANK_WS_HEARTBEAT_MS", 30000),
};

function hasPemTlsCredentials() {
  return (
    secretFileExists(config.tlsCertPath) &&
    secretFileExists(config.tlsPrivateKeyPath)
  );
}

function hasPfxTlsCredentials() {
  return secretFileExists(config.pfxPath) && Boolean(config.pfxPassphrase);
}

function hasQrPrivateKeyFile() {
  return secretFileExists(config.qrPrivateKeyPath);
}

const REQUIRED_WHEN_ENABLED = [
  "MACHBANK_BASE_URL",
  "MACHBANK_QR_GENERATE_URL",
  "MACHBANK_WS_URL",
  "MACHBANK_MERCHANT_CODE",
  "MACHBANK_MERCHANT_NAME",
  "MACHBANK_ACQUIRER_ID",
  "MACHBANK_MCC",
  "MACHBANK_TERMINAL_LABEL",
  "MACHBANK_STORE_LABEL",
  "MACHBANK_NPI_USER_ID",
  "MACHBANK_USERNAME",
  "MACHBANK_PASSWORD",
  "MACHBANK_WS_USERNAME",
  "MACHBANK_API_TOKEN",
  "MACHBANK_CURRENCY",
];

function assertEnabledConfig() {
  if (!config.enabled) return;

  const missing = REQUIRED_WHEN_ENABLED.filter((key) => !env(key));
  if (missing.length) {
    logMachbankIssue("missing required env", { keys: missing });
    throw new MachbankConfigError(CONFIG_CODES.INVALID_ENV);
  }

  if (
    !config.getpayPublicKey ||
    (typeof config.getpayPublicKey === "string" &&
      !config.getpayPublicKey.includes("BEGIN PUBLIC KEY"))
  ) {
    logMachbankIssue("getpay public key missing", {});
    throw new MachbankConfigError(CONFIG_CODES.INVALID_ENV);
  }

  if (!hasPemTlsCredentials() && !hasPfxTlsCredentials()) {
    logMachbankIssue(
      "mTLS credentials missing — set MACHBANK_TLS_CERT_PATH + MACHBANK_TLS_PRIVATE_KEY_PATH, or MACHBANK_PFX_PATH + MACHBANK_PFX_PASSPHRASE",
      {},
    );
    throw new MachbankConfigError(CONFIG_CODES.INVALID_ENV);
  }

  if (!hasQrPrivateKeyFile() && !hasPfxTlsCredentials() && !config.qrSigningPfxPath) {
    logMachbankIssue(
      "QR signing key missing — set MACHBANK_QR_PRIVATE_KEY_PATH (PEM) or keep PFX for signing fallback",
      {},
    );
    throw new MachbankConfigError(CONFIG_CODES.INVALID_ENV);
  }

  if (!config.bankMid) {
    throw new MachbankConfigError(CONFIG_CODES.MISSING_BANK_MID);
  }

  if (!config.npiUserId) {
    logMachbankIssue(
      "MACHBANK_NPI_USER_ID required (NCHL token userId — not MACHBANK_USERNAME)",
      {},
    );
    throw new MachbankConfigError(CONFIG_CODES.INVALID_ENV);
  }

  if (!config.requireGetpaySignature) {
    console.warn(
      "[Machbank] MACHBANK_REQUIRE_GETPAY_SIGNATURE=false — unsigned payment events may settle. Not recommended for production.",
    );
  }

  if (process.env.MACHBANK_WS_DEBUG_LOG === "true" && isProduction()) {
    console.warn(
      "[Machbank] MACHBANK_WS_DEBUG_LOG is ignored in production.",
    );
  }

  if (config.wsDebugLog) {
    console.warn(
      "[Machbank] WS debug logging enabled — redacted payloads only; disable after sandbox E2E.",
    );
  }
}

module.exports = {
  config,
  assertEnabledConfig,
  env,
  resolveSecretPath,
  hasPemTlsCredentials,
  hasPfxTlsCredentials,
  hasQrPrivateKeyFile,
};
