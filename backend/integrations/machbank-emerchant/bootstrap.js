"use strict";

const { config, assertEnabledConfig } = require("./config");
const { registerMachbankWebSocketHandler } = require("./ws-lifecycle");
const { assertWsTokenKeyUsable } = require("./crypto/encrypt-ws-token");
const paymentIntentService = require("../../api/services/payment-intent-service");
const { expirePaymentIntentsJob } = require("../../jobs/expire-payment-intents");
const logger = require("../../configs/logger");

function bootstrapMachbankEmerchant() {
  if (!config.enabled) {
    logger.info("Machbank eMerchant integration is disabled");
    return;
  }

  try {
    assertEnabledConfig();
  } catch (err) {
    const code = err.code || "CONFIG_INVALID";
    logger.error(`Machbank config invalid (${code})`);
    return;
  }

  registerMachbankWebSocketHandler((event) =>
    paymentIntentService.settleFromGatewayEvent(event),
  );

  // Surfaces a clear, actionable error at startup if the nqrws token key is unusable.
  assertWsTokenKeyUsable();

  expirePaymentIntentsJob.start();
  logger.info(
    `Machbank eMerchant ready (nqrws merchant_id=${config.wsMerchantId || "?"}; opens after successful QR generation)`,
  );
}

module.exports = { bootstrapMachbankEmerchant };
