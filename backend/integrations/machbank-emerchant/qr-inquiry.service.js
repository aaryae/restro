"use strict";

const { createMachbankClient } = require("./https-client");
const { config } = require("./config");
const { buildTransactionInquiryRequest } = require("./nepalpay-qr-spec");
const { logMachbankIssue } = require("./errors");
const logger = require("../../configs/logger");

/**
 * NCHL generateQR uses Basic auth. Inquiry must match — Bearer (nqrws token)
 * is for websocket only and is often wrong/missing in DB-managed integrations.
 */
async function postInquiry(body) {
  const client = createMachbankClient({ useBearer: false });
  const response = await client.post(config.qrInquiryUrl, body);
  return response.data;
}

/**
 * Optional bank transaction inquiry (NCHL merchant QR — transaction status section).
 * Primary fallback when nqrws websocket is unavailable (shared hosting).
 */
async function inquiryTransactionStatus({ billNumber, referenceLabel }) {
  if (!config.qrInquiryUrl || !config.bankMid) {
    return null;
  }

  const body = buildTransactionInquiryRequest({
    acquirerId: config.acquirerId,
    merchantId: config.bankMid,
    billNumber,
    referenceLabel,
  });

  try {
    return await postInquiry(body);
  } catch (err) {
    const status = err.response?.status;
    const bankMessage =
      err.response?.data?.responses?.[0]?.responseMessage ||
      err.response?.data?.responseMessage ||
      err.message;

    if (status === 403 || status === 404) {
      logger.warn(
        `[Machbank] transaction inquiry ${status} for bill=${billNumber} ref=${referenceLabel ?? "?"} — ` +
          "ask Machbank to enable /qr/transactionStatus for your merchant.",
      );
      return null;
    }

    logMachbankIssue("transaction inquiry failed", {
      billNumber,
      referenceLabel,
      message: bankMessage,
      status,
      response: err.response?.data,
    });
    return null;
  }
}

module.exports = { inquiryTransactionStatus };
