"use strict";

const cron = require("node-cron");
const { Op } = require("sequelize");
const { paymentIntentModel } = require("../models");
const logger = require("../configs/logger");
const { syncMachbankWebSocket } = require("../integrations/machbank-emerchant/ws-lifecycle");

const expirePaymentIntentsJob = cron.schedule("*/2 * * * *", async () => {
  try {
    const [count] = await paymentIntentModel.update(
      { status: "expired" },
      {
        where: {
          status: "pending",
          expiresAt: { [Op.lt]: new Date() },
        },
      },
    );
    if (count > 0) {
      logger.info(`Expired ${count} pending payment intent(s)`);
      await syncMachbankWebSocket();
    }
  } catch (err) {
    logger.error("expire-payment-intents job failed", err.message);
  }
});

module.exports = { expirePaymentIntentsJob };
