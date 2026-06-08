"use strict";

const logger = require("../../configs/logger");
const { safeJsonForLog } = require("./safe-log");

/** Internal codes — safe for server logs only. */
const CONFIG_CODES = {
  MISSING_BANK_MID: "MISSING_BANK_MID",
  MISSING_NUMERIC: "MISSING_NUMERIC",
  INVALID_ENV: "INVALID_ENV",
};

/** User-facing copy — no merchant ids, env var names, or credential hints. */
const PUBLIC_MESSAGES = {
  [CONFIG_CODES.MISSING_BANK_MID]:
    "Dynamic QR is not fully configured. Contact your administrator.",
  [CONFIG_CODES.MISSING_NUMERIC]:
    "Dynamic QR is not fully configured. Contact your administrator.",
  [CONFIG_CODES.INVALID_ENV]:
    "Dynamic QR is not fully configured. Contact your administrator.",
  BANK_UNAVAILABLE:
    "Payment provider is temporarily unavailable. Try again or use another payment method.",
  BANK_REJECTED:
    "Payment provider rejected the request. Contact your administrator or use another payment method.",
};

class MachbankConfigError extends Error {
  constructor(code) {
    super(code);
    this.name = "MachbankConfigError";
    this.code = code;
  }
}

function publicConfigMessage(code = CONFIG_CODES.INVALID_ENV) {
  return PUBLIC_MESSAGES[code] || PUBLIC_MESSAGES[CONFIG_CODES.INVALID_ENV];
}

/** Minimal audit fields for WS settlement — never store full bank payloads. */
function sanitizeRawConfirmPayload(event) {
  if (!event || typeof event !== "object") return null;
  return {
    status: event.status ?? null,
    gatewayTxnId: event.gatewayTxnId ?? null,
    amount: event.amount ?? null,
    merchantTxnRef: event.merchantTxnRef ?? null,
  };
}

function publicBankMessage() {
  return PUBLIC_MESSAGES.BANK_REJECTED;
}

function logMachbankIssue(context, payload) {
  const summary =
    payload?.message ||
    payload?.response?.responses?.[0]?.responseMessage ||
    null;
  const headline = summary ? `${context}: ${summary}` : context;
  logger.error(`[Machbank] ${headline}`, safeJsonForLog(payload));
}

/** Persist only non-sensitive fields from bank initiate responses. */
function sanitizeRawInitiateResponse(raw) {
  if (!raw || typeof raw !== "object") return null;
  const row = Array.isArray(raw.responses) ? raw.responses[0] : null;
  if (!row) return null;
  return {
    responseCode: row.responseCode != null ? String(row.responseCode) : null,
    responseMessage: row.responseMessage != null ? String(row.responseMessage) : null,
  };
}

module.exports = {
  CONFIG_CODES,
  PUBLIC_MESSAGES,
  MachbankConfigError,
  publicConfigMessage,
  publicBankMessage,
  logMachbankIssue,
  sanitizeRawInitiateResponse,
  sanitizeRawConfirmPayload,
};
