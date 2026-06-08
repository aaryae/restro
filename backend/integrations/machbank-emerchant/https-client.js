"use strict";

const fs = require("fs");
const https = require("https");
const axios = require("axios");
const {
  config,
  resolveSecretPath,
  hasPemTlsCredentials,
} = require("./config");

let cachedAgent;

function getHttpsAgent() {
  if (cachedAgent) return cachedAgent;

  const agentOptions = { rejectUnauthorized: false };

  if (hasPemTlsCredentials()) {
    agentOptions.cert = fs.readFileSync(resolveSecretPath(config.tlsCertPath));
    agentOptions.key = fs.readFileSync(resolveSecretPath(config.tlsPrivateKeyPath));
  } else if (config.pfxPath) {
    agentOptions.pfx = fs.readFileSync(resolveSecretPath(config.pfxPath));
    agentOptions.passphrase = config.pfxPassphrase;
  } else {
    return undefined;
  }

  cachedAgent = new https.Agent(agentOptions);
  return cachedAgent;
}

/**
 * NCHL generateQR uses Basic auth per official docs.
 * WebSocket / other calls may still use Bearer where configured.
 */
function createMachbankClient(options = {}) {
  const { useBearer = true } = options;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (useBearer && config.apiToken) {
    headers.Authorization = `Bearer ${config.apiToken}`;
  }

  return axios.create({
    timeout: config.httpTimeoutMs,
    httpsAgent: getHttpsAgent(),
    auth:
      config.username && config.password
        ? { username: config.username, password: config.password }
        : undefined,
    headers,
  });
}

module.exports = { createMachbankClient, getHttpsAgent };
