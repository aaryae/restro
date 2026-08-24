"use strict";

const crypto = require("crypto");
const { config } = require("../config");

/**
 * Verify getpay RSA signature on bank payment events.
 * When MACHBANK_REQUIRE_GETPAY_SIGNATURE=true (default), missing signature => reject.
 */
function verifyGetPaySignature(payload, signatureBase64) {
  if (!signatureBase64) {
    return !config.requireGetpaySignature;
  }

  if (!config.getpayPublicKey) {
    return false;
  }

  const canonical =
    payload.canonicalString ||
    payload.raw?.canonicalString ||
    [payload.merchantTxnRef, payload.amount, payload.gatewayTxnId]
      .filter((v) => v !== undefined && v !== null && v !== "")
      .join("|");

  if (!canonical) {
    return false;
  }

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(canonical);
  verifier.end();

  return verifier.verify(config.getpayPublicKey, signatureBase64, "base64");
}

module.exports = { verifyGetPaySignature };
