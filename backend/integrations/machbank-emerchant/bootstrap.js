"use strict";

const { config, assertEnabledConfig } = require("./config");
const { registerMachbankWebSocketHandler } = require("./ws-lifecycle");
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

  expirePaymentIntentsJob.start();
  logger.info(
    "Machbank eMerchant ready (nqrws opens after successful QR generation only)",
  );
}

module.exports = { bootstrapMachbankEmerchant };
