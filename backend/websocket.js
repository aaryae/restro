const { WebSocketServer } = require("ws");
const { verifyToken } = require("./helpers/jwt-helper");
const { findActiveSession } = require("./api/services/session-logs");
const { clients } = require("./helpers/send-notification");
const { tenantModel } = require("./models");
const {
  runWithTenantContext,
} = require("./lib/tenant-context");
const { resolveTenantSlug } = require("./lib/resolve-tenant-from-host");

async function resolveWebsocketTenant(req, jwtSlug) {
  // Prefer JWT-bound cafe; fall back to Host / query for local ?tenant=.
  let slug = jwtSlug || null;
  if (!slug) {
    try {
      const fakeReq = {
        headers: req.headers,
        query: Object.fromEntries(new URL(req.url, "http://localhost").searchParams),
        get(name) {
          return req.headers[String(name).toLowerCase()];
        },
      };
      slug = resolveTenantSlug(fakeReq);
    } catch {
      slug = null;
    }
  }
  if (!slug) return null;
  const tenant = await tenantModel.findOne({
    where: { slug: String(slug).toLowerCase() },
    raw: true,
  });
  if (!tenant) return null;
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    schemaName: tenant.schemaName,
    status: tenant.status,
  };
}

const initWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws, req) => {
    try {
      const protocolHeader = req.headers["sec-websocket-protocol"];
      if (!protocolHeader) {
        ws.terminate();
        return;
      }

      const authHeader = String(protocolHeader || "").trim();
      if (!authHeader.startsWith("Admin")) {
        ws.terminate();
        return;
      }

      const token = authHeader.replace(/^Admin\s+/i, "").trim();
      if (!token) {
        ws.terminate();
        return;
      }

      const userData = await verifyToken(token);
      if (!userData || !userData.id || !userData.sessionId) {
        ws.terminate();
        return;
      }

      const tenant = await resolveWebsocketTenant(req, userData.slug);
      if (!tenant) {
        ws.terminate();
        return;
      }

      if (userData.slug && userData.slug !== tenant.slug) {
        ws.terminate();
        return;
      }

      const isSession = await runWithTenantContext({ tenant }, () =>
        findActiveSession(userData.id, userData.sessionId),
      );
      if (!isSession) {
        ws.terminate();
        return;
      }

      clients.set(userData.id, ws);
      ws.user = userData;
      ws.tenant = tenant;
      ws.send("Connected to WebSocket server");

      const pingInterval = 30000;
      const pingPongInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        }
      }, pingInterval);

      ws.on("pong", () => {});

      ws.on("close", () => {
        clearInterval(pingPongInterval);
        clients.delete(userData.id);
      });
    } catch (err) {
      console.log("Error in WebSocket connection:", err.message);
      ws.terminate();
    }
  });
};

module.exports = { initWebSocket };
