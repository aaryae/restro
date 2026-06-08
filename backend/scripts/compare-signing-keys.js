#!/usr/bin/env node
"use strict";

/**
 * Prove whether PFX and PEM are the same signing key (run from backend/).
 * node scripts/compare-signing-keys.js
 */

require("dotenv").config();
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { config } = require("../integrations/machbank-emerchant/config");
const {
  buildSignatureString,
  signSHA256RSA,
  getPrivateKey,
} = require("../integrations/machbank-emerchant/crypto/sign-qr-token");

function fp(material) {
  const pem = getPrivateKey(material);
  const pub = crypto.createPublicKey(pem).export({ type: "spki", format: "der" });
  return crypto.createHash("sha256").update(pub).digest("hex");
}

const { resolveQrSigningPfxPath } = require("../integrations/machbank-emerchant/crypto/sign-qr-token");

function loadPfxKey() {
  const pfxPath = resolveQrSigningPfxPath();
  const pass = config.qrSigningPfxPassphrase || config.pfxPassphrase || "";
  const out = spawnSync(
    "openssl",
    [
      "pkcs12",
      "-legacy",
      "-in",
      pfxPath,
      "-nocerts",
      "-nodes",
      "-passin",
      `pass:${pass}`,
    ],
    { encoding: "utf8" },
  );
  if (!out.stdout) throw new Error(out.stderr || "PFX extract failed");
  return out.stdout;
}

const pemPath = path.resolve(process.cwd(), "secrets/qr-signing-private.pem");
const pfxKey = loadPfxKey();
const pemKey = fs.existsSync(pemPath) ? fs.readFileSync(pemPath, "utf8") : null;

const body = {
  acquirerId: config.acquirerId,
  merchantId: config.merchantId || config.bankMid,
  merchantCategoryCode: Number(config.mcc),
  transactionCurrency: 524,
  transactionAmount: "1.00",
  billNumber: "compare-test",
};
const tokenString = buildSignatureString(body, config.npiUserId);

console.log("Token string:", tokenString);
console.log("PFX public key SHA256:", fp(pfxKey));
if (pemKey) {
  console.log("PEM public key SHA256:", fp(pemKey));
  console.log("Same key?", fp(pfxKey) === fp(pemKey));
  console.log("PFX token (first 32):", signSHA256RSA(tokenString, pfxKey).slice(0, 32));
  console.log("PEM token (first 32):", signSHA256RSA(tokenString, pemKey).slice(0, 32));
} else {
  console.log("No secrets/qr-signing-private.pem for comparison");
  console.log("PFX token (first 32):", signSHA256RSA(tokenString, pfxKey).slice(0, 32));
}
