"use strict";

const { config } = require("./config");
const logger = require("../../configs/logger");

/**
 * NCHL WsTxnRecord status values.
 * QR Parsing phase: ENTR (connection established), PARSED.
 * QR Transaction phase: COMPLETED, FAILED.
 */
const CONTROL_STATUSES = new Set(["entr", "parsed", "subscribed", "pending"]);

const SUCCESS_STATUSES = new Set([
  "completed",
  "success",
  "successful",
  "paid",
  "00",
  "000",
  "s",
]);

const FAILURE_STATUSES = new Set([
  "failed",
  "failure",
  "rejected",
  "cancelled",
  "error",
]);

/** Per NCHL spec: debit_status success == 000; credit_status success == 000/999/DEFER. */
const DEBIT_SUCCESS = new Set(["000", "00", "0"]);
const CREDIT_SUCCESS = new Set(["000", "999", "defer", "00", "0"]);

function pickString(data, keys) {
  for (const key of keys) {
    const v = data[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return null;
}

function pickAmount(data) {
  const raw =
    data.amount ??
    data.txn_amount ??
    data.txnAmount ??
    data.transactionAmount ??
    data.paidAmount ??
    data.transaction_amount;
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function classifyStatus(statusRaw, debitStatus, creditStatus) {
  if (!statusRaw) return null;
  const s = statusRaw.toLowerCase();

  if (CONTROL_STATUSES.has(s)) return "control";

  // Bank "FAIL" is a websocket/auth error (e.g. token decryption), not a
  // transaction failure — surface it without marking the intent failed.
  if (s === "fail") return "error";

  if (FAILURE_STATUSES.has(s)) return "failed";

  if (SUCCESS_STATUSES.has(s)) {
    // COMPLETED is only a real settlement when the debit succeeded.
    if (s === "completed") {
      const debitOk = debitStatus ? DEBIT_SUCCESS.has(debitStatus.toLowerCase()) : true;
      const creditOk = creditStatus
        ? CREDIT_SUCCESS.has(creditStatus.toLowerCase())
        : true;
      if (debitOk && creditOk) return "paid";
      if (!debitOk) return "failed";
      return "paid";
    }
    return "paid";
  }

  return config.wsStrictParse ? null : "unknown";
}

/**
 * Parser for NepalPAY QR (nqrws) STOMP message bodies.
 * Returns:
 *  - { type: "control", ... } for ENTR/PARSED/SUBSCRIBED phases
 *  - { type: "settlement", status: "paid"|"failed", ... } for COMPLETED/FAILED
 *  - null when the payload is unusable
 */
function parseWsMessage(raw) {
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      logger.warn("Machbank nqrws: non-JSON message ignored");
      return null;
    }
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  const nested = data.data || data.payload || data.transaction || data;

  const requestId =
    pickString(nested, ["request_id", "requestId", "txn_id", "txnId"]) ||
    pickString(data, ["request_id", "requestId", "txn_id", "txnId"]);

  const statusRaw =
    pickString(nested, ["status", "txnStatus", "transactionStatus", "paymentStatus"]) ||
    pickString(data, ["status", "txnStatus", "transactionStatus", "paymentStatus"]);

  const debitStatus =
    pickString(nested, ["debit_status", "debitStatus"]) ||
    pickString(data, ["debit_status", "debitStatus"]);

  const creditStatus =
    pickString(nested, ["credit_status", "creditStatus"]) ||
    pickString(data, ["credit_status", "creditStatus"]);

  const message =
    pickString(nested, ["message"]) || pickString(data, ["message"]);

  const resolved = classifyStatus(statusRaw, debitStatus, creditStatus);

  if (resolved === "control" || resolved === "error") {
    return {
      type: resolved,
      status: statusRaw,
      requestId,
      message,
      raw: data,
    };
  }

  if (resolved !== "paid" && resolved !== "failed") {
    if (config.wsStrictParse) {
      logger.warn(
        `Machbank nqrws: ignored message with status=${statusRaw || "?"}`,
      );
    }
    return null;
  }

  const merchantTxnRef =
    pickString(nested, ["merchantTxnRef", "billNumber", "billNo", "referenceLabel"]) ||
    pickString(data, ["merchantTxnRef", "billNumber", "billNo", "referenceLabel"]);

  const gatewayTxnId =
    pickString(nested, ["gatewayTxnId", "transactionId", "txnId", "txn_id", "nchlTxnId", "rrn"]) ||
    pickString(data, ["gatewayTxnId", "transactionId", "txnId", "txn_id", "nchlTxnId", "rrn"]);

  const amount = pickAmount(nested) ?? pickAmount(data);

  const signature =
    pickString(nested, ["signature", "sign"]) ||
    pickString(data, ["signature", "sign"]);

  // Need at least one key to find the intent.
  if (!requestId && !merchantTxnRef && !gatewayTxnId) {
    logger.warn("Machbank nqrws: settlement message missing all lookup keys");
    return null;
  }

  return {
    type: "settlement",
    status: resolved,
    requestId,
    merchantTxnRef,
    gatewayTxnId,
    amount,
    signature,
    raw: data,
  };
}

module.exports = {
  parseWsMessage,
  classifyStatus,
  SUCCESS_STATUSES,
  FAILURE_STATUSES,
  CONTROL_STATUSES,
};
