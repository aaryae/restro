"use strict";

const { Op } = require("sequelize");
const { paymentIntentModel } = require("../../models");
const {
  registerMachbankWebSocketHandler,
  ensureMachbankWebSocket,
  stopMachbankWebSocket,
} = require("./websocket.client");
const { config } = require("./config");

async function countActivePendingIntents() {
  return paymentIntentModel.count({
    where: {
      status: "pending",
      expiresAt: { [Op.gt]: new Date() },
    },
  });
}

async function syncMachbankWebSocket() {
  if (!config.enabled) return;

  const pending = await countActivePendingIntents();
  if (pending > 0) {
    ensureMachbankWebSocket();
  } else {
    stopMachbankWebSocket();
  }
}

module.exports = {
  countActivePendingIntents,
  syncMachbankWebSocket,
  registerMachbankWebSocketHandler,
};
