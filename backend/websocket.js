const { WebSocketServer } = require("ws");
const { verifyToken } = require("./helpers/jwt-helper");
const { findSingleUserLog } = require("./api/services/session-logs");
// Import clients from notification.js instead of defining a new one
const { clients } = require("./helpers/send-notification");

const initWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws, req) => {
    try {
      const protocolHeader = req.headers["sec-websocket-protocol"];
      if (!protocolHeader) {
        console.log("No token provided, closing connection.");
        ws.terminate();
        return;
      }

      const authHeader = String(protocolHeader || "").trim();
      if (!authHeader.startsWith("Admin")) {
        console.log("Malformed websocket auth header.");
        ws.terminate();
        return;
      }

      const token = authHeader.replace("Admin", " ").trim();
      if (!token) {
        console.log("Token is empty, closing connection.");
        ws.terminate();
        return;
      }

      const userData = await verifyToken(token);
      if (!userData || !userData.id) {
        console.log("Invalid token, closing connection.");
        ws.terminate();
        return;
      }

      const isSession = await findSingleUserLog(userData.id);
      if (!isSession) {
        console.log("Unauthorized user, closing connection.");
        ws.terminate();
        return;
      }

      clients.set(userData.id, ws);
      ws.user = userData;
      console.log(`User connected: ${userData.id}`);
      ws.send("Connected to WebSocket server");

      // Ping/Pong mechanism
      const pingInterval = 30000; // 30 seconds for ping
      const pingTimeout = 10000; // 10 seconds for waiting pong response

      const pingPongInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          console.log(`Sending ping to user: ${userData.id}`);
          ws.ping(); // Send ping to the client
        }
      }, pingInterval);

      // Handle pong response from client
      ws.on("pong", () => {
        console.log(`Pong received from user: ${userData.id}`);
      });

      // Clean up when the connection is closed or if pong is not received within timeout
      ws.on("close", () => {
        clearInterval(pingPongInterval); // Clear ping interval on close
        clients.delete(userData.id);
        console.log(`User disconnected: ${userData.id}`);
      });
    } catch (err) {
      console.log("Error in WebSocket connection:", err.message);
      ws.terminate();
    }
  });
};

module.exports = { initWebSocket };
