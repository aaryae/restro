"use strict";

const { Op } = require("sequelize");

const USERNAME_MIN = 3;
const USERNAME_MAX = 30;

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, USERNAME_MAX);
}

function validateUsernameFormat(value) {
  const username = normalizeUsername(value);
  if (!username || username.length < USERNAME_MIN) {
    return {
      ok: false,
      username,
      message: `Username must be at least ${USERNAME_MIN} characters (a-z, 0-9, . _ -)`,
    };
  }
  if (!/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(username)) {
    return {
      ok: false,
      username,
      message:
        "Username must start and end with a letter or number (use a-z, 0-9, . _ -)",
    };
  }
  return { ok: true, username, message: null };
}

async function isUsernameTaken(username) {
  const { globalUsernameModel, trialUserModel, platformUserModel } =
    require("../models");
  const normalized = normalizeUsername(username);
  if (!normalized) return false;

  const globalHit = await globalUsernameModel.findOne({
    where: { username: normalized },
  });
  if (globalHit) return true;

  // Fallback for rows not yet backfilled into the registry.
  const [trialHit, platformHit] = await Promise.all([
    trialUserModel.findOne({
      where: { username: { [Op.iLike]: normalized } },
    }),
    platformUserModel.findOne({
      where: { username: { [Op.iLike]: normalized } },
    }),
  ]);
  return Boolean(trialHit || platformHit);
}

/**
 * Reserve a username globally. Throws Error with status 409 if taken.
 * Idempotent when the same source already owns the username.
 */
async function claimUsername(rawUsername, { source, tenantId = null } = {}) {
  const { globalUsernameModel } = require("../models");
  const checked = validateUsernameFormat(rawUsername);
  if (!checked.ok) {
    const err = new Error(checked.message);
    err.status = 400;
    throw err;
  }

  const username = checked.username;
  const existing = await globalUsernameModel.findOne({ where: { username } });
  if (existing) {
    const sameOwner =
      existing.source === source &&
      (tenantId == null || Number(existing.tenantId) === Number(tenantId));
    if (sameOwner) return username;
    const err = new Error("This username is already taken");
    err.status = 409;
    throw err;
  }

  try {
    await globalUsernameModel.create({
      username,
      source: source || "unknown",
      tenantId: tenantId || null,
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      const conflict = new Error("This username is already taken");
      conflict.status = 409;
      throw conflict;
    }
    throw err;
  }

  return username;
}

async function releaseUsername(rawUsername) {
  const { globalUsernameModel } = require("../models");
  const username = normalizeUsername(rawUsername);
  if (!username) return;
  await globalUsernameModel.destroy({ where: { username } });
}

module.exports = {
  USERNAME_MIN,
  USERNAME_MAX,
  normalizeUsername,
  validateUsernameFormat,
  isUsernameTaken,
  claimUsername,
  releaseUsername,
};
