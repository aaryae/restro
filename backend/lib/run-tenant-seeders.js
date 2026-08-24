"use strict";

const Sequelize = require("sequelize");
const { hashPassword } = require("../utils/bcrypt");
const { setTenantSearchPath } = require("./run-tenant-migrations");

const rolesSeeder = require("../seeders/20240516054600-demo-roles");

function patchQueryInterfaceForTenant(queryInterface, schemaName) {
  const originalBulkInsert = queryInterface.bulkInsert.bind(queryInterface);
  queryInterface.bulkInsert = (tableName, records, options) =>
    originalBulkInsert(tableName, records, {
      ...(options || {}),
      schema: schemaName,
    });
  return queryInterface;
}

/**
 * Seed baseline roles + owner user inside a tenant schema.
 */
async function runTenantSeeders(sequelize, schemaName, owner) {
  await setTenantSearchPath(sequelize, schemaName);

  const queryInterface = patchQueryInterfaceForTenant(
    sequelize.getQueryInterface(),
    schemaName,
  );
  await rolesSeeder.up(queryInterface, Sequelize);

  const passwordHash = await hashPassword(owner.password);
  const username = String(
    owner.username || owner.email.split("@")[0] || "owner",
  ).trim();

  await queryInterface.bulkInsert("settings", [
    {
      brand_name: owner.name || "Cafe",
      email: owner.email,
      primary_phone: owner.mobileNo || owner.phone || "9800000000",
      secondary_phone: owner.mobileNo || owner.phone || "9800000000",
      address: null,
      footer_desc: null,
      google_analytics: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  await queryInterface.bulkInsert("users", [
    {
      username,
      password: passwordHash,
      firstName: owner.firstName || "Owner",
      lastName: owner.lastName || owner.name || "User",
      email: owner.email,
      mobileNo: owner.mobileNo || owner.phone || "9800000000",
      mobilePrefix: owner.mobilePrefix || "+977",
      roleId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const [ownerRows] = await sequelize.query(
    `SELECT id FROM "${schemaName}".users WHERE email = :email ORDER BY id ASC LIMIT 1`,
    { replacements: { email: owner.email } },
  );
  const ownerUserId = ownerRows[0]?.id;
  if (!ownerUserId) {
    throw new Error("Failed to create owner user in tenant schema");
  }

  const now = new Date();
  const [inserted] = await sequelize.query(
    `INSERT INTO "${schemaName}".accounts
      (name, "accountType", "openingBalance", "currentBalance", status, "isDefault", description, "createdAt", "updatedAt")
     VALUES ('Cash', 'cash', 0, 0, 'active', true, 'Default cash register', :now, :now)
     RETURNING id`,
    { replacements: { now } },
  );
  const accountId = inserted[0]?.id;
  if (accountId) {
    await sequelize.query(
      `INSERT INTO "${schemaName}".cash_accounts ("accountId", "createdAt", "updatedAt")
       VALUES (:accountId, :now, :now)`,
      { replacements: { accountId, now } },
    );
  }

  return { ownerUserId };
}

/** Idempotent: ensure every tenant schema has a default cash account. */
async function ensureDefaultCashAccount(sequelize, schemaName) {
  await setTenantSearchPath(sequelize, schemaName);

  const [existing] = await sequelize.query(
    `SELECT id FROM "${schemaName}".accounts WHERE "accountType" = 'cash' LIMIT 1`,
  );
  if (existing.length) return existing[0].id;

  const now = new Date();
  const [inserted] = await sequelize.query(
    `INSERT INTO "${schemaName}".accounts
      (name, "accountType", "openingBalance", "currentBalance", status, "isDefault", description, "createdAt", "updatedAt")
     VALUES ('Cash', 'cash', 0, 0, 'active', true, 'Default cash register', :now, :now)
     RETURNING id`,
    { replacements: { now } },
  );
  const accountId = inserted[0]?.id;
  if (accountId) {
    await sequelize.query(
      `INSERT INTO "${schemaName}".cash_accounts ("accountId", "createdAt", "updatedAt")
       VALUES (:accountId, :now, :now)`,
      { replacements: { accountId, now } },
    );
  }
  return accountId;
}

module.exports = { runTenantSeeders, ensureDefaultCashAccount };
