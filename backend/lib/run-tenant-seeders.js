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
  const username = owner.username || owner.email.split("@")[0];

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
}

module.exports = { runTenantSeeders };
