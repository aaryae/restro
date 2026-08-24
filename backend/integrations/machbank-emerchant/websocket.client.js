"use strict";

const WebSocket = require("ws");
const { URL } = require("url");
const { config } = require("./config");
const { getHttpsAgent } = require("./https-client");
const { parseWsMessage } = require("./parse-ws-event");
const { encodeFrame, decodeFrames } = require("./stomp");
const { encryptWsToken, canEncryptWsToken } = require("./crypto/encrypt-ws-token");
const { safeJsonForLog } = require("./safe-log");
const logger = require("../../configs/logger");

const SUBSCRIBE_DESTINATION = "/user/nqrws/check-txn-status";
const SEND_DESTINATION = "/nqrws/check-txn-status";

let wsInstance = null;
let reconnectTimer = null;
let reconnectDelay = 1000;
let onEventHandler = null;
let allowReconnect = false;
let stompConnected = false;
let connectWatchdog = null;

/** ms to wait for a STOMP CONNECTED frame after the socket opens. */
const STOMP_CONNECT_TIMEOUT_MS = 15000;

function clearConnectWatchdog() {
  if (connectWatchdog) {
    clearTimeout(connectWatchdog);
    connectWatchdog = null;
  }
}

function startConnectWatchdog() {
  clearConnectWatchdog();
  connectWatchdog = setTimeout(() => {
    if (!stompConnected) {
      logger.error(
        "Machbank nqrws: socket opened but no STOMP CONNECTED frame within " +
          `${STOMP_CONNECT_TIMEOUT_MS}ms. The endpoint is likely not a raw STOMP-over-WebSocket ` +
          `(${config.wsUrl}). Confirm with Machbank whether nqrws is plain WebSocket+STOMP or ` +
          "SockJS (which needs the /websocket transport path + SockJS framing), and verify Bearer auth.",
      );
    }
  }, STOMP_CONNECT_TIMEOUT_MS);
}

/** requestId (validationTraceId) -> { merchantId, sent } */
const activeRequests = new Map();

function isWsActive() {
  if (!wsInstance) return false;
  return (
    wsInstance.readyState === WebSocket.OPEN ||
    wsInstance.readyState === WebSocket.CONNECTING
  );
}

function buildCheckTxnPayload(requestId, merchantId) {
  return JSON.stringify({
    merchant_id: merchantId || config.wsMerchantId,
    request_id: requestId,
    username: config.wsUsername,
    api_token: encryptWsToken(config.apiToken),
  });
}

function sendCheckTxnStatus(requestId, entry) {
  if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
  try {
    const body = buildCheckTxnPayload(requestId, entry.merchantId);
    wsInstance.send(
      encodeFrame(
        "SEND",
        {
          destination: SEND_DESTINATION,
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
        },
        body,
      ),
    );
    entry.sent = true;
    if (config.wsDebugLog) {
      const parsed = JSON.parse(body);
      logger.info(
        `[Machbank sandbox] nqrws SEND ${SEND_DESTINATION} ` +
          `merchant_id=${parsed.merchant_id} request_id=${parsed.request_id} ` +
          `username=${parsed.username} api_token=<encrypted:${parsed.api_token?.length || 0}b>`,
      );
    }
  } catch (err) {
    logger.error("Machbank nqrws check-txn-status send failed", err.message);
  }
}

function flushPendingRequests() {
  if (!stompConnected) return;
  for (const [requestId, entry] of activeRequests) {
    if (!entry.sent) {
      sendCheckTxnStatus(requestId, entry);
    }
  }
}

function subscribe() {
  if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
  wsInstance.send(
    encodeFrame("SUBSCRIBE", {
      id: "sub-nqrws-0",
      destination: SUBSCRIBE_DESTINATION,
      ack: "auto",
    }),
  );
  if (config.wsDebugLog) {
    logger.info(`[Machbank sandbox] nqrws SUBSCRIBE ${SUBSCRIBE_DESTINATION}`);
  }
}

function sendConnectFrame() {
  let host = "";
  try {
    host = new URL(config.wsUrl).host;
  } catch {
    host = "";
  }
  wsInstance.send(
    encodeFrame("CONNECT", {
      "accept-version": "1.1,1.2",
      "heart-beat": "10000,10000",
      ...(host ? { host } : {}),
    }),
  );
}

function handleStompFrame(frame) {
  switch (frame.command) {
    case "CONNECTED":
      stompConnected = true;
      clearConnectWatchdog();
      logger.info("Machbank nqrws STOMP connected");
      subscribe();
      flushPendingRequests();
      return;
    case "MESSAGE":
      handleMessageBody(frame.body);
      return;
    case "ERROR":
      logger.error(
        `Machbank nqrws STOMP error frame: ${safeJsonForLog(frame.headers?.message || frame.body)}`,
      );
      return;
    case "RECEIPT":
      return;
    default:
      return;
  }
}

async function handleMessageBody(body) {
  if (!body || !body.trim()) return;

  if (config.wsDebugLog) {
    logger.info(`[Machbank sandbox] nqrws MESSAGE: ${safeJsonForLog(body)}`);
  }

  const event = parseWsMessage(body);

  if (config.wsDebugLog) {
    logger.info(
      `[Machbank sandbox] nqrws parsed: ${safeJsonForLog(event || { rejected: true })}`,
    );
  }

  if (!event) return;

  // Bank-side auth/websocket error (e.g. "Token decryption failed").
  if (event.type === "error") {
    logger.error(
      `Machbank nqrws ${event.status}: ${event.message || "websocket error"} (request_id=${event.requestId || "?"})`,
    );
    return;
  }

  // Control phases (ENTR/PARSED/SUBSCRIBED) carry no settlement.
  if (event.type === "control") {
    logger.info(
      `Machbank nqrws ${event.status} request_id=${event.requestId || "?"} ${event.message || ""}`.trim(),
    );
    return;
  }

  if (!onEventHandler) return;
  try {
    await onEventHandler(event);
  } catch (err) {
    logger.error("Machbank nqrws event handler error", err.message);
  }
}

function connect() {
  if (!config.enabled || isWsActive()) return;

  if (!canEncryptWsToken()) {
    logger.error(
      "Machbank nqrws not started: token public key invalid/missing — cannot encrypt api_token.",
    );
    return;
  }

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
    logger.info("Machbank nqrws socket open");
    reconnectDelay = 1000;
    stompConnected = false;
    try {
      sendConnectFrame();
      startConnectWatchdog();
    } catch (err) {
      logger.error("Machbank nqrws CONNECT send failed", err.message);
    }
  });

  wsInstance.on("message", (buf) => {
    let frames;
    try {
      frames = decodeFrames(buf);
    } catch (err) {
      logger.warn(`Machbank nqrws frame decode failed: ${err.message}`);
      return;
    }
    for (const frame of frames) {
      handleStompFrame(frame);
    }
  });

  wsInstance.on("close", () => {
    wsInstance = null;
    stompConnected = false;
    clearConnectWatchdog();
    for (const entry of activeRequests.values()) {
      entry.sent = false;
    }
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

/**
 * Replace the set of transactions we are watching. Each request needs the
 * NCHL validationTraceId (request_id). New ones are sent immediately when the
 * STOMP session is live; the rest are sent on (re)connect.
 */
function setActiveRequests(requests = []) {
  activeRequests.clear();
  for (const req of requests) {
    if (!req || !req.requestId) continue;
    activeRequests.set(String(req.requestId), {
      merchantId: req.merchantId || config.wsMerchantId,
      sent: false,
    });
  }
  flushPendingRequests();
}

function ensureMachbankWebSocket() {
  if (!config.enabled) return;
  allowReconnect = true;
  if (isWsActive()) {
    flushPendingRequests();
  } else {
    connect();
  }
}

function stopMachbankWebSocket() {
  allowReconnect = false;
  stompConnected = false;
  activeRequests.clear();
  clearConnectWatchdog();
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
  setActiveRequests,
  ensureMachbankWebSocket,
  stopMachbankWebSocket,
  startMachbankWebSocket,
};
