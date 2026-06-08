"use strict";

const { config } = require("./config");

function buildMerchantContext() {
  const merchantCode = config.bankMid || config.merchantCode;
  const merchantCategoryCode = String(config.mcc || "").trim();

  return {
    merchantCode,
    merchantCategoryCode,
    mcc: merchantCategoryCode,
    acquirerId: config.acquirerId,
    terminalLabel: config.terminalLabel,
    storeLabel: config.storeLabel || config.merchantName,
    merchantName: config.merchantName,
    merchantCity: config.merchantCity,
  };
}

/** nqrws JSON auth after connect (token sign-in). */
function buildWsTokenSignInPayload() {
  const ctx = buildMerchantContext();
  return {
    username: config.wsUsername,
    webSocketUsername: config.wsUsername,
    apiToken: config.apiToken,
    merchantCode: ctx.merchantCode,
    merchantCategoryCode: ctx.merchantCategoryCode,
    mcc: ctx.mcc,
    acquirerId: ctx.acquirerId,
    terminalLabel: ctx.terminalLabel,
    storeLabel: ctx.storeLabel,
  };
}

module.exports = { buildMerchantContext, buildWsTokenSignInPayload };
