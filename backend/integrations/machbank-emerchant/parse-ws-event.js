"use strict";

const { config } = require("./config");
const logger = require("../../configs/logger");

/** Align with Machbank PDF — update when bank confirms exact values. */
const SUCCESS_STATUSES = new Set([
  "success",
  "successful",
  "paid",
  "completed",
  "00",
  "s",
]);

const FAILURE_STATUSES = new Set([
  "failed",
  "failure",
  "rejected",
  "cancelled",
  "error",
]);

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
    data.txnAmount ??
    data.transactionAmount ??
    data.paidAmount;
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function resolveStatus(data) {
  const statusRaw = pickString(data, [
    "status",
    "txnStatus",
    "transactionStatus",
    "paymentStatus",
  ]);

  if (!statusRaw) {
    if (data.success === true || data.isSuccess === true) return "paid";
    if (data.success === false || data.isSuccess === false) return "failed";
    return config.wsStrictParse ? null : "unknown";
  }

  const normalized = statusRaw.toLowerCase();
  if (SUCCESS_STATUSES.has(normalized)) return "paid";
  if (FAILURE_STATUSES.has(normalized)) return "failed";
  return config.wsStrictParse ? null : "unknown";
}

/**
 * Strict parser for Machbank nqrws payment notifications.
 * Returns null when payload does not match expected shape (no settlement).
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

  const merchantTxnRef = pickString(nested, [
    "merchantTxnRef",
    "billNumber",
    "billNo",
    "referenceLabel",
  ]) || pickString(data, [
    "merchantTxnRef",
    "billNumber",
    "billNo",
    "referenceLabel",
  ]);

  const gatewayTxnId = pickString(nested, [
    "gatewayTxnId",
    "transactionId",
    "txnId",
    "nchlTxnId",
    "rrn",
  ]) || pickString(data, [
    "gatewayTxnId",
    "transactionId",
    "txnId",
    "nchlTxnId",
    "rrn",
  ]);

  const status = resolveStatus(nested) || resolveStatus(data);
  const amount = pickAmount(nested) ?? pickAmount(data);

  const signature =
    pickString(nested, ["signature", "sign"]) ||
    pickString(data, ["signature", "sign"]);

  if (config.wsStrictParse) {
    if (!merchantTxnRef) {
      logger.warn("Machbank nqrws: rejected — missing merchantTxnRef/billNumber");
      return null;
    }
    if (!status) {
      logger.warn("Machbank nqrws: rejected — unknown or missing status");
      return null;
    }
    if (status === "paid") {
      if (amount === null) {
        logger.warn(
          "Machbank nqrws: rejected paid event — missing amount",
        );
        return null;
      }
      if (!gatewayTxnId) {
        logger.warn(
          "Machbank nqrws: rejected paid event — missing gatewayTxnId",
        );
        return null;
      }
    }
  } else if (!merchantTxnRef && !gatewayTxnId) {
    return null;
  }

  if (!status || status === "unknown") {
    return null;
  }

  return {
    merchantTxnRef,
    gatewayTxnId,
    amount,
    status,
    signature,
    raw: data,
  };
}

module.exports = { parseWsMessage, SUCCESS_STATUSES, FAILURE_STATUSES };
