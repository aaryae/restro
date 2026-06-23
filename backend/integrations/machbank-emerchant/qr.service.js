"use strict";

const { createMachbankClient } = require("./https-client");
const { config } = require("./config");
const { logMachbankIssue } = require("./errors");
const {
  POINT_OF_INIT_DYNAMIC,
  buildMerchantQrGenerationRequest,
} = require("./nepalpay-qr-spec");

const BANK_SUCCESS_CODES = new Set([
  "00",
  "0",
  "000",
  "SUCCESS",
  "success",
]);

// EMVCo tag 62-08 (Purpose of Transaction) caps at 25 chars.
const PURPOSE_MAX_LEN = 25;

function buildGenerateQrPayload({ amount, merchantTxnRef, purposeOfTransaction }) {
  const purpose = String(purposeOfTransaction || "Bill payment")
    .trim()
    .slice(0, PURPOSE_MAX_LEN);

  return buildMerchantQrGenerationRequest({
    pointOfInitialization: POINT_OF_INIT_DYNAMIC,
    acquirerId: config.acquirerId,
    merchantId: config.bankMid || config.merchantCode,
    merchantName: config.merchantName,
    merchantCity: config.merchantCity,
    merchantPostalCode: config.merchantPostalCode,
    merchantCategoryCode: config.mcc,
    terminalLabel: config.terminalLabel,
    storeLabel: config.storeLabel,
    transactionCurrency: config.currencyCode,
    transactionAmount: amount,
    billNumber: merchantTxnRef,
    referenceLabel: "payment",
    purposeOfTransaction: purpose,
    userId: config.npiUserId,
    qrImage: config.qrRequestImage,
  });
}

function getResponseRow(data) {
  if (!data || typeof data !== "object") {
    return null;
  }
  if (Array.isArray(data.responses) && data.responses[0]) {
    return data.responses[0];
  }
  if (data.responseCode != null || data.responseMessage != null) {
    return data;
  }
  return null;
}

function assertBankResponses(data) {
  const row = getResponseRow(data);
  const topCode = data?.responseCode != null ? String(data.responseCode) : "";
  const code = row?.responseCode != null ? String(row.responseCode) : topCode;
  const status = row?.responseStatus || data?.responseStatus;

  if (status && String(status).toUpperCase() === "SUCCESS") {
    return;
  }

  if (code && BANK_SUCCESS_CODES.has(code)) {
    return;
  }

  if (row || topCode) {
    const err = new Error(
      row?.responseMessage ||
        row?.responseDescription ||
        data?.responseMessage ||
        `Machbank rejected QR request (${code || "unknown"})`,
    );
    err.responseData = data;
    err.bankCode = code;
    throw err;
  }
}

function extractQrFromResponse(data) {
  if (!data || typeof data !== "object") {
    return { qrPayload: null, qrImageUrl: null, validationTraceId: null };
  }

  const nested = data.data || data.responses?.[0]?.data || data.responses?.[0] || data;

  const qrPayload =
    nested.qrString ||
    nested.qrPayload ||
    nested.qrCode ||
    data.qrString ||
    data.qrPayload ||
    null;

  let qrImageUrl = null;
  const qrImage = nested.qrImage || data.qrImage;
  if (qrImage && typeof qrImage === "string") {
    qrImageUrl = qrImage.startsWith("data:")
      ? qrImage
      : `data:image/png;base64,${qrImage}`;
  }

  const validationTraceId =
    nested.validationTraceId || data.validationTraceId || null;

  return { qrPayload, qrImageUrl, validationTraceId };
}

async function generateDynamicQr({ amount, merchantTxnRef, purposeOfTransaction }) {
  const client = createMachbankClient({ useBearer: false });
  const body = buildGenerateQrPayload({
    amount,
    merchantTxnRef,
    purposeOfTransaction,
  });

  let response;
  try {
    response = await client.post(config.qrGenerateUrl, body);
  } catch (err) {
    logMachbankIssue("generateQR HTTP error", {
      message: err.message,
      status: err.response?.status,
      response: err.response?.data,
    });
    throw err;
  }

  try {
    assertBankResponses(response.data);
  } catch (err) {
    throw err;
  }

  const { qrPayload, qrImageUrl, validationTraceId } = extractQrFromResponse(
    response.data,
  );

  if (!qrPayload && !qrImageUrl) {
    const err = new Error(
      "generateQR response did not include qrString or QR image",
    );
    err.responseData = response.data;
    logMachbankIssue("generateQR empty QR fields", { response: response.data });
    throw err;
  }

  return {
    qrPayload,
    qrImageUrl,
    validationTraceId,
    raw: response.data,
  };
}

module.exports = {
  generateDynamicQr,
  buildGenerateQrPayload,
};
