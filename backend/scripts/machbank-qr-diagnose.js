#!/usr/bin/env node
"use strict";

/**
 * Run from backend/: node scripts/machbank-qr-diagnose.js [amount]
 * Prints the exact generateQR payload to send Machbank for review.
 */

require("dotenv").config();
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  config,
  resolveSecretPath,
  hasPemTlsCredentials,
} = require("../integrations/machbank-emerchant/config");
const { buildGenerateQrPayload } = require("../integrations/machbank-emerchant/qr.service");
const { formatGenerateQrOutboundJson } = require("../integrations/machbank-emerchant/outbound-generate-qr");
const { createMachbankClient } = require("../integrations/machbank-emerchant/https-client");
const {
  qrTokenSigningSource,
  resolveQrSigningPfxPath,
  resolveQrPrivateKeyPath,
  usesQrPrivateKeyFile,
  signingPublicKeyFingerprintSha256,
  loadSigningPrivateKeyPem,
} = require("../integrations/machbank-emerchant/crypto/sign-qr-token");

const BANK_SAMPLE_TOKEN =
  "rwXQUvhxvGaHdyjWpExXI/3ceMzNvn3Wz0Q4a8y3y/NjbHJ383PP5EmJLzOWUE16u4namBn92eQj1S73u0kLs7uoPy4dVl8xCv04gfQgp3j8BcdNGjlhervsQGeNrcPiezxfsqiWIpNUh1t4nSHNsBeBLNHqP0WSZbk+dS8DCMDNMDoIPijIh1osr8CVjGm+Lre/P/NONApGEi694xOPNqoYuT9GsGurlAto9sTTy38tQlRC4qG+oqItqeJ3E91U7+rPTQUUeD6rSKg0ZpFvCOAoQKn4Jeb1a4eHY6DKOD5Yamjh0l+YNtlspFuqxlh3jEMZ1y5xMWR49wu2UKR+Cw==";

function resolvePfx(pfxPath) {
  return path.isAbsolute(pfxPath)
    ? pfxPath
    : path.resolve(process.cwd(), pfxPath);
}

function pfxCertInfo(pfxPath, passphrase) {
  const pfx = resolvePfx(pfxPath);
  const passin = `pass:${passphrase || ""}`;
  const cert = spawnSync(
    "openssl",
    ["pkcs12", "-legacy", "-in", pfx, "-clcerts", "-nokeys", "-passin", passin],
    { encoding: "utf8" },
  );
  if (cert.status !== 0) {
    return { fingerprint: "(could not read cert from PFX)", subject: null };
  }
  const fp = spawnSync(
    "openssl",
    ["x509", "-noout", "-fingerprint", "-sha256"],
    { input: cert.stdout, encoding: "utf8" },
  );
  const subj = spawnSync("openssl", ["x509", "-noout", "-subject"], {
    input: cert.stdout,
    encoding: "utf8",
  });
  return {
    fingerprint: (fp.stdout || "").trim(),
    subject: (subj.stdout || "").trim(),
  };
}

function bankTokenMatchesSigningCert(pfxPath, passphrase) {
  const pfx = resolvePfx(pfxPath);
  const passin = `pass:${passphrase || ""}`;
  const cert = spawnSync(
    "openssl",
    ["pkcs12", "-legacy", "-in", pfx, "-clcerts", "-nokeys", "-passin", passin],
    { encoding: "utf8" },
  );
  if (cert.status !== 0) return false;
  const ts = "00011501,1501KQZRFMY,5311,524,1.25,11,theroadside";
  try {
    return crypto
      .createVerify("RSA-SHA256")
      .update(ts, "utf8")
      .verify(cert.stdout, BANK_SAMPLE_TOKEN, "base64");
  } catch {
    return false;
  }
}

async function main() {
  const amount = Number(process.argv[2]) || 1.25;
  const ref = process.argv[3] || "11";
  const body = buildGenerateQrPayload({ amount, merchantTxnRef: ref });

  console.log("========== Start Payload ==========\n");
  console.log(formatGenerateQrOutboundJson(body));
  console.log("\n========== End Payload==========\n");

  if (hasPemTlsCredentials()) {
    console.log(
      "mTLS PEM:",
      resolveSecretPath(config.tlsCertPath),
      resolveSecretPath(config.tlsPrivateKeyPath),
      "OK",
    );
  } else if (config.pfxPath) {
    const mTlsPfx = resolvePfx(config.pfxPath);
    console.log("mTLS PFX:", mTlsPfx, fs.existsSync(mTlsPfx) ? "OK" : "MISSING");
  }

  const signingPfx = resolveQrSigningPfxPath();
  console.log("QR signing source:", qrTokenSigningSource());
  if (qrTokenSigningSource() === "MACHBANK_QR_PRIVATE_KEY_PATH") {
    console.log(
      "QR signing PEM:",
      resolveQrPrivateKeyPath(),
      usesQrPrivateKeyFile() ? "OK" : "MISSING",
    );
  } else if (signingPfx) {
    console.log(
      "QR signing PFX:",
      signingPfx,
      fs.existsSync(signingPfx) ? "OK" : "MISSING",
    );
  }

  const certInfo =
    signingPfx && fs.existsSync(signingPfx)
      ? pfxCertInfo(
          signingPfx,
          config.qrSigningPfxPassphrase || config.pfxPassphrase,
        )
      : { fingerprint: "(PEM signing — no PFX cert)", subject: null };

  console.log("QR signing PFX cert:", certInfo.subject);
  console.log("QR signing PFX cert SHA256:", certInfo.fingerprint);

  const bankMatches =
    signingPfx && fs.existsSync(signingPfx)
      ? bankTokenMatchesSigningCert(
          signingPfx,
          config.qrSigningPfxPassphrase || config.pfxPassphrase,
        )
      : false;
  const {
    buildSignatureString,
    verifyQrTokenLocally,
  } = require("../integrations/machbank-emerchant/crypto/sign-qr-token");
  const tokenString = buildSignatureString(body, config.npiUserId);
  const localVerify = verifyQrTokenLocally(tokenString, body.token);

  console.log("Token string:", tokenString);
  console.log("Local verify (our PFX signs & verifies):", localVerify);
  console.log(
    "Machbank portal sample token verifies against our PFX:",
    bankMatches ? "YES" : "NO (expected — portal uses bank-registered NPI key)",
  );
  console.log("Our signed token length:", body.token ? body.token.length : 0);
  console.log("Our token is null/empty:", !body.token);
  if (localVerify.ok) {
    console.log(
      "Diagnosis: local RSA-SHA256 signing OK (matches NCHL doc).",
    );
  } else {
    console.log(
      "Diagnosis: local verify failed — check PFX passphrase or openssl pkcs12 -legacy.",
    );
  }

  const client = createMachbankClient({ useBearer: false });
  let liveCode;
  let liveMessage;
  try {
    const res = await client.post(config.qrGenerateUrl, body);
    const row = res.data?.responses?.[0] || res.data;
    liveCode = row.responseCode;
    liveMessage = row.responseMessage;
    console.log("Live API (our signature):", liveCode, liveMessage);
    if (row.data?.qrString) {
      console.log("qrString received, length:", row.data.qrString.length);
    }
  } catch (err) {
    const row = err.response?.data?.responses?.[0] || err.response?.data;
    liveCode = row?.responseCode;
    liveMessage = row?.responseMessage || err.message;
    console.log("Live API (our signature):", liveCode, liveMessage);
  }

  if (localVerify.ok && String(liveMessage || "").toLowerCase().includes("invalid token")) {
    console.log("");
    console.log("BLOCKER: NCHL does not have this PFX public key enrolled for your merchant.");
    console.log("Send Machbank support:");
    console.log("  - merchantId:", config.bankMid);
    console.log("  - npiUserId:", config.npiUserId);
    console.log("  - signing PFX cert SHA256:", certInfo.fingerprint);
    console.log(
      "  - signing public key SHA256:",
      signingPublicKeyFingerprintSha256(loadSigningPrivateKeyPem()) ||
        "(unknown)",
    );
    console.log(
      "  - export cert: node scripts/export-qr-signing-cert.js > roadside-signing.cer",
    );
    console.log(
      "Bank test keys (qr-signing-private.pem / npi-signing.pfx) are a different key pair — they work only until your production PFX is enrolled.",
    );
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
