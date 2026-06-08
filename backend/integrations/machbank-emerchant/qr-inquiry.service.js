"use strict";

const { createMachbankClient } = require("./https-client");
const { config } = require("./config");
const { buildTransactionInquiryRequest } = require("./nepalpay-qr-spec");
const { logMachbankIssue } = require("./errors");

/**
 * Optional bank transaction inquiry (NCHL merchant QR — transaction status section).
 * Machbank path may return 403 until enabled for your merchant; DB + nqrws remain primary.
 */
async function inquiryTransactionStatus({ billNumber, referenceLabel }) {
  if (!config.qrInquiryUrl || !config.bankMid) {
    return null;
  }

  const client = createMachbankClient();
  const body = buildTransactionInquiryRequest({
    merchantId: config.bankMid,
    billNumber,
    referenceLabel,
  });

  try {
    const response = await client.post(config.qrInquiryUrl, body);
    return response.data;
  } catch (err) {
    if (err.response?.status === 403 || err.response?.status === 404) {
      return null;
    }
    logMachbankIssue("transaction inquiry failed", {
      message: err.message,
      status: err.response?.status,
      response: err.response?.data,
    });
    return null;
  }
}

module.exports = { inquiryTransactionStatus };
