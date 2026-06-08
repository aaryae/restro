"use strict";

/**
 * Single source of truth for environment checks.
 * NODE_ENV: Node/Sequelize convention (development | production | test)
 * ENV: app-level label from .env (e.g. development | production)
 */
function normalizeEnv(value) {
  return (value || "").trim().toLowerCase();
}

function isProduction() {
  return (
    normalizeEnv(process.env.NODE_ENV) === "production" ||
    normalizeEnv(process.env.ENV) === "production"
  );
}

function isDevelopment() {
  return !isProduction();
}

module.exports = { isProduction, isDevelopment, normalizeEnv };
