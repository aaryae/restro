"use strict";

const WebSocket = require("ws");
const { config } = require("./config");
const { getHttpsAgent } = require("./https-client");
const { parseWsMessage } = require("./parse-ws-event");
const { safeJsonForLog } = require("./safe-log");
const { buildWsTokenSignInPayload } = require("./merchant-context");
const logger = require("../../configs/logger");

let wsInstance = null;
let reconnectTimer = null;
let reconnectDelay = 1000;
let onEventHandler = null;
let allowReconnect = false;

function buildAuthMessage() {
  return JSON.stringify(buildWsTokenSignInPayload());
}

function isWsActive() {
  if (!wsInstance) return false;
  return (
    wsInstance.readyState === WebSocket.OPEN ||
    wsInstance.readyState === WebSocket.CONNECTING
  );
}

function connect() {
  if (!config.enabled || isWsActive()) return;

  const wsOptions = {
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
    },
  };
  const tlsAgent = getHttpsAgent();
  if (tlsAgent) {
    wsOptions.agent = tlsAgent;
  }
  wsInstance = new WebSocket(config.wsUrl, wsOptions);

  wsInstance.on("open", () => {
    logger.info("Machbank nqrws connected");
    reconnectDelay = 1000;
    try {
      wsInstance.send(buildAuthMessage());
    } catch (err) {
      logger.error("Machbank nqrws auth send failed", err.message);
    }
  });

  wsInstance.on("message", async (buf) => {
    const text = buf.toString();

    if (config.wsDebugLog) {
      logger.info(
        `[Machbank sandbox] nqrws raw message (redacted): ${safeJsonForLog(text)}`,
      );
    }

    const event = parseWsMessage(text);

    if (config.wsDebugLog) {
      logger.info(
        `[Machbank sandbox] nqrws parsed event: ${safeJsonForLog(event || { rejected: true })}`,
      );
    }

    if (!event) {
      if (!config.wsDebugLog) {
        logger.debug(
          `Machbank nqrws message not applied (strict parse): ${safeJsonForLog(text).slice(0, 300)}`,
        );
      }
      return;
    }
    if (onEventHandler) {
      try {
        await onEventHandler(event);
      } catch (err) {
        logger.error("Machbank nqrws event handler error", err.message);
      }
    }
  });

  wsInstance.on("close", () => {
    wsInstance = null;
    if (!allowReconnect) {
      logger.info("Machbank nqrws closed (no active QR session)");
      return;
    }
    logger.warn("Machbank nqrws disconnected");
    scheduleReconnect();
  });

  wsInstance.on("error", (err) => {
    logger.error("Machbank nqrws error", err.message);
    wsInstance?.close();
  });
}

function scheduleReconnect() {
  if (!config.enabled || !allowReconnect || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 2, config.wsReconnectMaxMs);
    connect();
  }, reconnectDelay);
}

function registerMachbankWebSocketHandler(handler) {
  onEventHandler = handler;
}

function ensureMachbankWebSocket() {
  if (!config.enabled) return;
  allowReconnect = true;
  connect();
}

function stopMachbankWebSocket() {
  allowReconnect = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (wsInstance) {
    wsInstance.removeAllListeners();
    wsInstance.close();
    wsInstance = null;
  }
}

function startMachbankWebSocket(handler) {
  registerMachbankWebSocketHandler(handler);
  ensureMachbankWebSocket();
}

module.exports = {
  registerMachbankWebSocketHandler,
  ensureMachbankWebSocket,
  stopMachbankWebSocket,
  startMachbankWebSocket,
};
