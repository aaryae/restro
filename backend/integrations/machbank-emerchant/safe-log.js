"use strict";

const SENSITIVE_KEYS = [
  "password",
  "apiToken",
  "api_token",
  "apitoken",
  "token",
  "authorization",
  "bearer",
  "pfx",
  "passphrase",
  "secret",
  "username",
  "wsusername",
  "merchantcode",
  "merchantid",
  "merchantname",
  "acquirerid",
  "terminallabel",
  "qrstring",
  "qrpayload",
  "privatekey",
  "getpay",
];

function redactValue(key, value) {
  if (
    SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))
  ) {
    return "[REDACTED]";
  }
  return value;
}

function redactObject(obj, depth = 0) {
  if (depth > 5 || obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item, depth + 1));
  }
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      out[key] = redactObject(value, depth + 1);
    } else {
      out[key] = redactValue(key, value);
    }
  }
  return out;
}

/** Safe string for logs — never includes apiToken or passwords. */
function safeJsonForLog(payload) {
  try {
    return JSON.stringify(redactObject(payload));
  } catch {
    return "[unserializable]";
  }
}

module.exports = { safeJsonForLog, redactObject };
