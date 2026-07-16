require("dotenv").config({ path: ".env" });
const { app, server } = require("./app");
const { sequelize } = require("./models");
const port = process.env.PORT || 8000;
const env = process.env.ENV || "Development";
const appName = process.env.APP_NAME || "General Asahi Admin";

app.set("PORT_NUMBER", port);

server.listen(port, "0.0.0.0", () => {
  const date = new Date();
  console.log("|--------------------------------------------");
  console.log("| Server       : " + appName);
  console.log("| Environment  : " + env);
  console.log("| Port         : " + port);
  console.log("| Date         : " + date.toJSON().split("T").join(" "));
  console.log("|--------------------------------------------");
});

let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    console.log(`Shutdown signal received (${signal}). Closing server...`);
    await new Promise((resolve) => {
      // Stop accepting new requests and finish active ones.
      server.close(() => resolve());
    });
  } catch (err) {
    console.error("Error while closing HTTP server:", err?.message || err);
  }

  try {
    if (sequelize && typeof sequelize.close === "function") {
      console.log("Closing Sequelize connections...");
      await sequelize.close();
    }
  } catch (err) {
    console.error("Error while closing Sequelize:", err?.message || err);
  } finally {
    // Hard exit fallback (shared hosting can hang on open handles).
    setTimeout(() => process.exit(0), 1000).unref?.();
    process.exit(0);
  }
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// second test deploy