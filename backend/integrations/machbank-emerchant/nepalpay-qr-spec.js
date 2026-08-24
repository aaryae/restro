
"use strict";

const { formatAmount, buildSignedQrTokenFromBody } = require("./crypto/sign-qr-token");

const POINT_OF_INIT_STATIC = 11;
const POINT_OF_INIT_DYNAMIC = 12;
const CURRENCY_NPR_NUMERIC = 524;
const COUNTRY_NP = "NP";

function buildMerchantQrGenerationRequest({
  acquirerId,
  merchantId,
  merchantName,
  merchantCity,
  merchantCountry,
  merchantPostalCode,
  merchantCategoryCode,
  terminalLabel,
  storeLabel,
  transactionCurrency,
  transactionAmount,
  billNumber,
  referenceLabel,
  purposeOfTransaction,
  userId,
  qrImage = true,
  pointOfInitialization = POINT_OF_INIT_DYNAMIC,
}) {
  const mcc = Number(merchantCategoryCode);
  const amountStr = formatAmount(transactionAmount);
  const bill = String(billNumber).slice(0, 25);

  const bodyWithoutToken = {
    pointOfInitialization,
    acquirerId,
    merchantId,
    merchantName,
    merchantCategoryCode: mcc,
    merchantCountry: merchantCountry || COUNTRY_NP,
    merchantCity: merchantCity || "",
    merchantPostalCode: merchantPostalCode || "",
    merchantLanguage: "en",
    transactionCurrency,
    transactionAmount: amountStr,
    valueOfConvenienceFeeFixed: "0.00",
    billNumber: bill,
    referenceLabel: referenceLabel !== undefined ? referenceLabel : null,
    mobileNo: null,
    storeLabel,
    terminalLabel: terminalLabel || "",
    purposeOfTransaction: purposeOfTransaction || "Bill payment",
    additionalConsumerDataRequest: null,
    loyaltyNumber: null,
    qrImage: Boolean(qrImage),
  };

  const { token } = buildSignedQrTokenFromBody(bodyWithoutToken, userId);

  return {
    ...bodyWithoutToken,
    token,
  };
}

/** Parse EMV QR tag 62 subfield 01 — NCHL bill number embedded in qrString (not merchantTxnRef). */
function parseNchlBillNumberFromQrPayload(qrPayload) {
  return parseEmvTag62Subfield(qrPayload, "01");
}

/** Same default as generateDynamicQr — inquiry must use the matching referenceLabel. */
const DEFAULT_QR_REFERENCE_LABEL = "payment";

function parseEmvTag62Subfield(qrPayload, subTag) {
  if (!qrPayload || typeof qrPayload !== "string") {
    return null;
  }

  let i = 0;
  while (i + 4 <= qrPayload.length) {
    const tag = qrPayload.slice(i, i + 2);
    const len = Number(qrPayload.slice(i + 2, i + 4));
    if (!Number.isFinite(len) || len < 0 || i + 4 + len > qrPayload.length) {
      break;
    }
    const value = qrPayload.slice(i + 4, i + 4 + len);
    if (tag === "62") {
      let j = 0;
      while (j + 4 <= value.length) {
        const st = value.slice(j, j + 2);
        const subLen = Number(value.slice(j + 2, j + 4));
        if (
          !Number.isFinite(subLen) ||
          subLen < 0 ||
          j + 4 + subLen > value.length
        ) {
          break;
        }
        const subValue = value.slice(j + 4, j + 4 + subLen);
        if (st === subTag && subValue) {
          return subValue;
        }
        j += 4 + subLen;
      }
      return null;
    }
    i += 4 + len;
  }
  return null;
}

function parseNchlReferenceLabelFromQrPayload(qrPayload) {
  return parseEmvTag62Subfield(qrPayload, "05");
}

function buildTransactionInquiryRequest({
  acquirerId,
  merchantId,
  billNumber,
  referenceLabel,
}) {
  const body = {
    merchantId,
    billNumber,
    referenceLabel: referenceLabel ?? DEFAULT_QR_REFERENCE_LABEL,
  };
  if (acquirerId) {
    body.acquirerId = acquirerId;
  }
  return body;
}

module.exports = {
  POINT_OF_INIT_STATIC,
  POINT_OF_INIT_DYNAMIC,
  CURRENCY_NPR_NUMERIC,
  COUNTRY_NP,
  DEFAULT_QR_REFERENCE_LABEL,
  buildMerchantQrGenerationRequest,
  buildTransactionInquiryRequest,
  parseNchlBillNumberFromQrPayload,
  parseNchlReferenceLabelFromQrPayload,
};
