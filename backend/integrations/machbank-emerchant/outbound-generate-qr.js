"use strict";

const fs = require("fs");
const path = require("path");
const {
  config,
  resolveSecretPath,
  hasPemTlsCredentials,
  hasPfxTlsCredentials,
} = require("./config");
const {
  buildSignatureString,
  verifyQrTokenLocally,
  resolvePfxPath,
  resolveQrSigningPfxPath,
  resolveQrPrivateKeyPath,
  qrTokenSigningSource,
  usesQrPrivateKeyFile,
} = require("./crypto/sign-qr-token");

function resolveConfiguredPfxPath(pfxPath) {
  if (!pfxPath) return pfxPath;
  return path.isAbsolute(pfxPath)
    ? pfxPath
    : path.resolve(process.cwd(), pfxPath);
}

/** Mandatory per NCHL Merchant QR introduction (+ token). */
const NCHL_REQUIRED_FIELDS = [
  "pointOfInitialization",
  "acquirerId",
  "merchantId",
  "merchantName",
  "merchantCategoryCode",
  "merchantCity",
  "merchantCountry",
  "merchantPostalCode",
  "transactionCurrency",
  "transactionAmount",
  "storeLabel",
  "token",
];

function auditNchlRequiredFields(body) {
  const missing = [];
  const empty = [];
  for (const key of NCHL_REQUIRED_FIELDS) {
    if (body[key] === undefined) missing.push(key);
    else if (body[key] === "" || body[key] === null) empty.push(key);
  }
  return {
    allRequiredPresent: missing.length === 0,
    missingRequired: missing,
    emptyRequired: empty,
    optionalNullFields: [
      "referenceLabel",
      "mobileNo",
      "additionalConsumerDataRequest",
      "loyaltyNumber",
    ].filter((k) => body[k] === null),
  };
}

/** Diagnostic payload for scripts/machbank-qr-diagnose.js (not used at runtime). */
function buildGenerateQrOutboundPackage(body) {
  const tokenString = buildSignatureString(body, config.npiUserId);
  const localVerify = verifyQrTokenLocally(tokenString, body.token);

  const docSample = {
    pointOfInitialization: 12,
    acquirerId: "(your acquirer)",
    merchantId: "(creditor id)",
    merchantPostalCode: "4600",
    referenceLabel: null,
    mobileNo: null,
    storeLabel: "Store1",
    terminalLabel: "Terminal1",
    purposeOfTransaction: "Bill payment",
    token: "(RSA-SHA256 PFX signature, base64)",
  };

  const payloadAudit = auditNchlRequiredFields(body);

  return {
    method: "POST",
    url: config.qrGenerateUrl,
    payloadAudit,
    nchlDocReference:
      "https://doc.connectips.com/docs_npiqrgt/NepalPAY-QR/Merchant-QR-generation/introduction",
    nchlDocSampleShape: docSample,
    fieldNotes: {
      referenceLabel:
        "null per NCHL curl sample (not duplicated billNumber)",
      mobileNo: "null per NCHL (optional)",
      nullFieldsAreValid:
        "E003 INVALID TOKEN in docs is signature/userId, not null optionals",
    },
    transport: {
      tlsMode: hasPemTlsCredentials()
        ? "MACHBANK_TLS_CERT_PATH + MACHBANK_TLS_PRIVATE_KEY_PATH"
        : hasPfxTlsCredentials()
          ? "MACHBANK_PFX_PATH"
          : "none",
      tlsCertPath: resolveSecretPath(config.tlsCertPath),
      tlsPrivateKeyPath: resolveSecretPath(config.tlsPrivateKeyPath),
      tlsClientCertificatePfxPath: resolveConfiguredPfxPath(config.pfxPath),
      qrTokenSigningSource: qrTokenSigningSource(),
      qrSigningPrivateKeyPath: resolveQrPrivateKeyPath(),
      qrSigningPrivateKeyFileExists: usesQrPrivateKeyFile(),
      qrSigningCertificatePfxPath: resolveQrSigningPfxPath(),
      httpAuth: "Basic",
      httpAuthUsername: config.username || null,
      httpAuthPassword: config.password ? "[REDACTED]" : null,
      bearerOnGenerateQr: false,
    },
    npiUserIdUsedInTokenString: config.npiUserId,
    tokenStringUsedForSigning: tokenString,
    tokenFieldTypes: {
      acquirerId: typeof body.acquirerId,
      merchantId: typeof body.merchantId,
      merchantCategoryCode: typeof body.merchantCategoryCode,
      transactionCurrency: typeof body.transactionCurrency,
      transactionAmount: typeof body.transactionAmount,
      billNumber: typeof body.billNumber,
    },
    localSignatureVerify: localVerify,
    tokenValidationHint:
      localVerify.ok === true
        ? "Local RSA verify OK — if bank returns Invalid token, they do not have this PFX public key registered (ask for NPI.pfx) or NPI userId differs."
        : "Local RSA verify failed — signing bug or wrong passphrase/PFX.",
    signedTokenBase64: body.token || null,
    signedTokenLength: body.token ? body.token.length : 0,
    requestBody: body,
  };
}

function formatGenerateQrOutboundJson(body) {
  return JSON.stringify(buildGenerateQrOutboundPackage(body), null, 2);
}

module.exports = {
  buildGenerateQrOutboundPackage,
  formatGenerateQrOutboundJson,
  auditNchlRequiredFields,
  NCHL_REQUIRED_FIELDS,
};
