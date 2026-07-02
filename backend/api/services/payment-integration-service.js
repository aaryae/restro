"use strict";

const {
  paymentIntegrationModel,
  accountModel,
  sequelize,
} = require("../../models");
const { encrypt, assertMasterKeyUsable } = require("../../integrations/machbank-emerchant/crypto/secret-box");
const {
  refreshMachbankConfig,
} = require("../../integrations/machbank-emerchant/config");
const { syncMachbankWebSocket } = require("../../integrations/machbank-emerchant/ws-lifecycle");
const logger = require("../../configs/logger");

const SECRET_COLUMNS = ["passwordEnc", "webhookTokenEnc", "npiPrivateKeyEnc"];

/**
 * Shape a row for the API: never expose secret blobs; instead expose booleans
 * so the UI can show "configured" state and an edit hint ("leave blank to keep").
 * Rows are loaded WITH the secret columns (server-side only) so these presence
 * flags are accurate; toPublic() is the single chokepoint that strips them.
 */
function toPublic(row) {
  if (!row) return null;
  const plain = typeof row.toJSON === "function" ? row.toJSON() : { ...row };
  SECRET_COLUMNS.forEach((col) => delete plain[col]);
  return {
    ...plain,
    hasPassword: Boolean(row.passwordEnc),
    hasWebhookToken: Boolean(row.webhookTokenEnc),
    hasNpiPrivateKey: Boolean(row.npiPrivateKeyEnc),
  };
}

/** Re-apply the active integration to the live runtime config + websocket. */
async function reloadRuntime() {
  try {
    await refreshMachbankConfig();
    await syncMachbankWebSocket();
  } catch (err) {
    logger.error(`[PaymentIntegration] runtime reload failed: ${err.message}`);
  }
}

const list = async () => {
  const rows = await paymentIntegrationModel.findAll({
    include: [{ model: accountModel, as: "account", attributes: ["id", "name", "accountType"] }],
    order: [["createdAt", "DESC"]],
  });
  return {
    status: 200,
    success: true,
    data: rows.map(toPublic),
    message: "Payment integrations fetched",
  };
};

/** Account ids that have an active, enabled integration (for checkout linkage). */
const activeAccountIds = async () => {
  const rows = await paymentIntegrationModel.findAll({
    attributes: ["accountId"],
    where: { isActive: true, enabled: true },
    raw: true,
  });
  const ids = rows
    .map((r) => r.accountId)
    .filter((id) => id !== null && id !== undefined);
  return {
    status: 200,
    success: true,
    data: ids,
    message: "Active integration accounts fetched",
  };
};

const getById = async (req) => {
  const id = +req.params.id;
  const row = await paymentIntegrationModel.findByPk(id, {
    include: [{ model: accountModel, as: "account", attributes: ["id", "name", "accountType"] }],
  });
  if (!row) {
    return { status: 404, success: false, message: "Payment integration not found" };
  }
  return { status: 200, success: true, data: toPublic(row), message: "Payment integration fetched" };
};

function buildIdentityFields(body) {
  return {
    name: body.name,
    provider: body.provider || "nepalpay",
    accountId: body.accountId ?? null,
    merchantId: body.merchantId,
    merchantCode: body.merchantCode ?? null,
    merchantCategoryCode: body.merchantCategoryCode ?? null,
    merchantName: body.merchantName,
    acquirerId: body.acquirerId ?? null,
    merchantCity: body.merchantCity ?? null,
    merchantPostalCode: body.merchantPostalCode ?? null,
    username: body.username ?? null,
    npiUsername: body.npiUsername ?? null,
    enabled: body.enabled !== undefined ? Boolean(body.enabled) : true,
  };
}

const create = async (req) => {
  assertMasterKeyUsable();
  const body = req.body || {};
  const makeActive = Boolean(body.isActive);

  const record = {
    ...buildIdentityFields(body),
    passwordEnc: encrypt(body.password),
    webhookTokenEnc: encrypt(body.webhookToken),
    npiPrivateKeyEnc: encrypt(body.npiPrivateKey),
    isActive: makeActive,
  };

  const created = await sequelize.transaction(async (t) => {
    if (makeActive) {
      await paymentIntegrationModel.update(
        { isActive: false },
        { where: { provider: record.provider }, transaction: t },
      );
    }
    return paymentIntegrationModel.create(record, { transaction: t });
  });

  if (makeActive) {
    await reloadRuntime();
  }

  const fresh = await paymentIntegrationModel.findByPk(created.id);
  return { status: 201, success: true, data: toPublic(fresh), message: "Payment integration created" };
};

const update = async (req) => {
  assertMasterKeyUsable();
  const id = +req.params.id;
  const body = req.body || {};

  const existing = await paymentIntegrationModel.findByPk(id);
  if (!existing) {
    return { status: 404, success: false, message: "Payment integration not found" };
  }

  const updates = buildIdentityFields(body);

  // Secrets are write-only: only re-encrypt when a non-empty value is provided.
  // A blank field means "keep the existing secret".
  if (body.password) updates.passwordEnc = encrypt(body.password);
  if (body.webhookToken) updates.webhookTokenEnc = encrypt(body.webhookToken);
  if (body.npiPrivateKey) updates.npiPrivateKeyEnc = encrypt(body.npiPrivateKey);

  const makeActive = body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive;
  updates.isActive = makeActive;

  await sequelize.transaction(async (t) => {
    if (makeActive) {
      await paymentIntegrationModel.update(
        { isActive: false },
        { where: { provider: updates.provider }, transaction: t },
      );
    }
    await paymentIntegrationModel.update(updates, { where: { id }, transaction: t });
  });

  // Reload if this row is (or was) the active one so live config stays correct.
  if (makeActive || existing.isActive) {
    await reloadRuntime();
  }

  const fresh = await paymentIntegrationModel.findByPk(id);
  return { status: 200, success: true, data: toPublic(fresh), message: "Payment integration updated" };
};

const setActive = async (req) => {
  const id = +req.params.id;
  const existing = await paymentIntegrationModel.findByPk(id);
  if (!existing) {
    return { status: 404, success: false, message: "Payment integration not found" };
  }

  await sequelize.transaction(async (t) => {
    await paymentIntegrationModel.update(
      { isActive: false },
      { where: { provider: existing.provider }, transaction: t },
    );
    await paymentIntegrationModel.update(
      { isActive: true, enabled: true },
      { where: { id }, transaction: t },
    );
  });

  await reloadRuntime();

  const fresh = await paymentIntegrationModel.findByPk(id);
  return { status: 200, success: true, data: toPublic(fresh), message: "Payment integration activated" };
};

const remove = async (req) => {
  const id = +req.params.id;
  const existing = await paymentIntegrationModel.findByPk(id);
  if (!existing) {
    return { status: 404, success: false, message: "Payment integration not found" };
  }
  const wasActive = existing.isActive;
  await paymentIntegrationModel.destroy({ where: { id } });

  // If we removed the active config, fall back to .env (or none).
  if (wasActive) {
    await reloadRuntime();
  }
  return { status: 200, success: true, data: { id }, message: "Payment integration deleted" };
};

module.exports = {
  list,
  getById,
  activeAccountIds,
  create,
  update,
  setActive,
  remove,
};
