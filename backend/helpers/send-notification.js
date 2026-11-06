const { notificationModel } = require("../models");
const { WebSocket } = require("ws");
const { getTenantContext } = require("../lib/tenant-context");

// Direct user notifications. Keyed by user id (can collide across cafes).
const clients = new Map();
// Every live staff socket — used for cafe-scoped broadcasts.
const liveSockets = new Set();

function registerSocket(ws) {
  liveSockets.add(ws);
}

function unregisterSocket(ws) {
  liveSockets.delete(ws);
}

/**
 * Push a JSON event to staff sockets for one cafe.
 * When slug is set, sockets bound to a different cafe are skipped.
 */
function broadcastToTenant(slug, payload) {
  const message = JSON.stringify(payload);
  for (const client of liveSockets) {
    if (client.readyState !== WebSocket.OPEN) continue;
    if (slug && client.tenant?.slug && client.tenant.slug !== slug) continue;
    client.send(message);
  }
}

/**
 * Send a notification to a specific user.
 * @param {number} userId - ID of the user to notify.
 * @param {number} senderId - ID of the sender.
 * @param {string} message - Notification message.
 * @param {string} type - Notification type.
 * @param {string} username .
 */
const sendNotification = async (
  username,
  userId,
  senderId,
  message,
  type,
  requestId,
) => {
  const notification = await notificationModel.create({
    userId,
    senderId,
    message,
    type,
    request_id: requestId,
  });

  // Send real-time notification if user is online
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(
      JSON.stringify({
        notificationId: notification.id,
        message: `${username} ${message}`,
        type,
        requestId,
      }),
    );
  }
};

/**
 * Push a real-time event to all connected admin clients (e.g. QR payment received).
 */
const broadcastPaymentEvent = (payload) => {
  const slug = getTenantContext()?.tenant?.slug || null;
  broadcastToTenant(slug, payload);
};

module.exports = {
  sendNotification,
  clients,
  registerSocket,
  unregisterSocket,
  broadcastToTenant,
  broadcastPaymentEvent,
};
