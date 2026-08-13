"use strict";

const cron = require("node-cron");
const { Op } = require("sequelize");
const { tenantModel } = require("../models");
const logger = require("../configs/logger");

/**
 * Flip trial cafes past trialEndsAt → expired.
 * Middleware also does a lazy check; this keeps the control plane accurate.
 */
const expireTrialsJob = cron.schedule("*/15 * * * *", async () => {
  try {
    const [count] = await tenantModel.update(
      { status: "expired" },
      {
        where: {
          status: "trial",
          trialEndsAt: { [Op.lt]: new Date() },
        },
      },
    );
    if (count > 0) {
      logger.info(`Expired ${count} trial cafe(s)`);
    }
  } catch (err) {
    logger.error("expire-trials job failed", err.message);
  }
});

module.exports = { expireTrialsJob };
