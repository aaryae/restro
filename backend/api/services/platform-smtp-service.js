"use strict";

const { smtpModel, platformAuditLogModel } = require("../../models");

const PUBLIC_SEARCH = { searchPath: "public" };

function sanitize(row) {
  if (!row) {
    return { configured: false };
  }
  const j = typeof row.toJSON === "function" ? row.toJSON() : row;
  return {
    configured: true,
    id: j.id,
    username: j.username,
    host: j.host,
    port: Number(j.port),
    secure: Boolean(j.secure),
    hasPasskey: Boolean(j.passkey),
  };
}

async function writeAudit({ platformUserId, action, meta }) {
  await platformAuditLogModel.create({
    platformUserId: platformUserId || null,
    tenantId: null,
    action,
    meta: meta || null,
  });
}

async function findPublicSmtp() {
  return smtpModel.findOne({ ...PUBLIC_SEARCH });
}

const getSmtp = async () => {
  const row = await findPublicSmtp();
  return {
    status: 200,
    success: true,
    message: "OK",
    data: sanitize(row),
  };
};

const upsertSmtp = async (req) => {
  const body = req.body || {};
  const username = String(body.username || "").trim();
  const host = String(body.host || "").trim();
  const passkeyRaw = body.passkey != null ? String(body.passkey) : "";
  const passkey = passkeyRaw.trim();
  const port = Number(body.port);
  const secure = Boolean(body.secure);

  if (!username || !host || !Number.isFinite(port) || port <= 0) {
    return {
      status: 400,
      success: false,
      message: "Username, host, and a valid port are required",
    };
  }

  if (typeof body.secure !== "boolean") {
    return {
      status: 400,
      success: false,
      message: "Secure must be true or false",
    };
  }

  const existing = await findPublicSmtp();

  if (!existing && !passkey) {
    return {
      status: 400,
      success: false,
      message: "Passkey is required when configuring SMTP for the first time",
    };
  }

  let row;
  if (!existing) {
    row = await smtpModel.create(
      {
        username,
        passkey,
        host,
        port,
        secure,
      },
      { ...PUBLIC_SEARCH },
    );
  } else {
    const patch = { username, host, port, secure };
    if (passkey) patch.passkey = passkey;
    await existing.update(patch, { ...PUBLIC_SEARCH });
    row = existing;
  }

  await writeAudit({
    platformUserId: req.platformUser?.id,
    action: "smtp.update",
    meta: { username, host, port, secure },
  });

  return {
    status: 200,
    success: true,
    message: existing ? "SMTP updated" : "SMTP configured",
    data: sanitize(row),
  };
};

module.exports = {
  getSmtp,
  upsertSmtp,
};
