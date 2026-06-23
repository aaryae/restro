"use strict";

const { Op } = require("sequelize");
const { paymentIntentModel } = require("../../models");
const {
  registerMachbankWebSocketHandler,
  setActiveRequests,
  ensureMachbankWebSocket,
  stopMachbankWebSocket,
} = require("./websocket.client");
const { config } = require("./config");
const logger = require("../../configs/logger");

async function getActivePendingIntents() {
  return paymentIntentModel.findAll({
    where: {
      status: "pending",
      expiresAt: { [Op.gt]: new Date() },
    },
    attributes: ["id", "validationTraceId"],
  });
}

async function countActivePendingIntents() {
  return paymentIntentModel.count({
    where: {
      status: "pending",
      expiresAt: { [Op.gt]: new Date() },
    },
  });
}

/**
 * Open/refresh the nqrws subscription for every active pending QR, or close the
 * socket when there is nothing to watch. Each request is keyed by the NCHL
 * validationTraceId captured at QR generation.
 */
async function syncMachbankWebSocket() {
  if (!config.enabled) return;

  const intents = await getActivePendingIntents();

  const requests = intents
    .filter((i) => i.validationTraceId)
    .map((i) => ({ requestId: i.validationTraceId }));

  const missingTrace = intents.length - requests.length;
  if (missingTrace > 0) {
    logger.warn(
      `Machbank nqrws: ${missingTrace} pending intent(s) without validationTraceId cannot be watched.`,
    );
  }

  if (requests.length > 0) {
    setActiveRequests(requests);
    ensureMachbankWebSocket();
  } else {
    stopMachbankWebSocket();
  }
}

module.exports = {
  countActivePendingIntents,
  getActivePendingIntents,
  syncMachbankWebSocket,
  registerMachbankWebSocketHandler,
};
