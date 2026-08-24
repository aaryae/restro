#!/usr/bin/env node
"use strict";

/**
 * Prove NCHL token steps i–iv match openssl SHA256withRSA from PFX.
 * Run from backend/: node scripts/verify-nchl-signing-steps.js
 */

require("dotenv").config();
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  buildSignatureString,
  signNchlTokenSteps,
  signSHA256RSA,
  loadPrivateKeyPemFromPfx,
  getPrivateKey,
  resolveQrSigningPfxPath,
  qrTokenSigningSource,
} = require("../integrations/machbank-emerchant/crypto/sign-qr-token");
const { config } = require("../integrations/machbank-emerchant/config");

const sampleRequest = {
  acquirerId: config.acquirerId,
  merchantId: config.bankMid || config.merchantCode,
  merchantCategoryCode: Number(config.mcc),
  transactionCurrency: config.currencyCode,
  transactionAmount: "10.00",
  billNumber: "NCHL-STEP-TEST",
};

function opensslSignFromPfx(tokenString, pfxPath, passphrase) {
  const passin = passphrase ? `pass:${passphrase}` : "pass:";
  const keyOut = spawnSync(
    "openssl",
    ["pkcs12", "-legacy", "-in", pfxPath, "-nocerts", "-nodes", "-passin", passin],
    { encoding: "utf8", maxBuffer: 1024 * 1024 },
  );
  if (keyOut.status !== 0) {
    throw new Error(keyOut.stderr || "pkcs12 extract failed");
  }

  const keyFile = path.join(process.cwd(), ".tmp-nchl-sign-key.pem");
  fs.writeFileSync(keyFile, keyOut.stdout, { mode: 0o600 });
  try {
    const sign = spawnSync(
      "openssl",
      ["dgst", "-sha256", "-sign", keyFile],
      { input: tokenString, maxBuffer: 1024 * 1024 },
    );
    if (sign.status !== 0) {
      throw new Error(sign.stderr?.toString() || "openssl dgst -sha256 -sign failed");
    }
    return Buffer.from(sign.stdout).toString("base64");
  } finally {
    fs.unlinkSync(keyFile);
  }
}

function main() {
  const tokenString = buildSignatureString(sampleRequest, config.npiUserId);
  const pfxPath = resolveQrSigningPfxPath();
  const pass = config.qrSigningPfxPassphrase || config.pfxPassphrase || "";

  console.log("NCHL token signing verification");
  console.log("  source:", qrTokenSigningSource());
  console.log("  pfx:", pfxPath);
  console.log("  tokenString:", tokenString);
  console.log("");

  const privateKeyPem = getPrivateKey(loadPrivateKeyPemFromPfx());

  // Step i (SHA256 digest) — logged for audit; createSign applies i+ii together
  const digestHex = crypto
    .createHash("sha256")
    .update(tokenString, "utf8")
    .digest("hex");
  console.log("i.   SHA256 digest (hex):", digestHex);

  // Step ii + iii via our implementation
  const nodeToken = signNchlTokenSteps(tokenString, privateKeyPem);
  const pipelineToken = signSHA256RSA(tokenString);
  console.log("ii.  SHA256withRSA sign: OK (via signNchlTokenSteps)");
  console.log("iii. base64 signature length:", nodeToken.length);

  // Cross-check: openssl dgst -sha256 -sign from same PFX
  const opensslToken = opensslSignFromPfx(tokenString, pfxPath, pass);
  const matchOpenssl = nodeToken === opensslToken;
  const matchPipeline = nodeToken === pipelineToken;

  console.log("");
  console.log("Matches openssl dgst -sha256 -sign (PFX key):", matchOpenssl ? "YES" : "NO");
  console.log("signSHA256RSA matches signNchlTokenSteps:", matchPipeline ? "YES" : "NO");
  console.log("iv.  token field (first 48 chars):", nodeToken.slice(0, 48) + "...");

  if (!matchOpenssl || !matchPipeline) {
    process.exit(1);
  }
}

main();
