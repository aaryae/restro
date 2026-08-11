"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");

function metaTable(schemaName) {
  return `"${schemaName}"."SequelizeMeta"`;
}

async function ensureMetaTable(sequelize, schemaName) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ${metaTable(schemaName)} (
      name VARCHAR(255) NOT NULL PRIMARY KEY
    )
  `);
}

async function getExecutedMigrations(sequelize, schemaName) {
  const [rows] = await sequelize.query(
    `SELECT name FROM ${metaTable(schemaName)}`,
  );
  return new Set(rows.map((row) => row.name));
}

async function setTenantSearchPath(sequelize, schemaName) {
  await sequelize.query(`SET search_path TO "${schemaName}", public`);
}

function withSchema(options, schemaName) {
  return { ...(options || {}), schema: schemaName };
}

function tableInSchema(tableName, schemaName) {
  if (tableName && typeof tableName === "object") {
    return { ...tableName, schema: schemaName };
  }
  return { tableName, schema: schemaName };
}

/**
 * Sequelize defaults to public unless schema is set on each call.
 * Pass { tableName, schema } so indexes/constraints land in the tenant schema.
 */
function patchQueryInterfaceForTenant(queryInterface, schemaName) {
  const prefix = `${schemaName.replace(/-/g, "_")}_`;
  queryInterface._tenantSchema = schemaName;

  const originalCreateTable = queryInterface.createTable.bind(queryInterface);
  queryInterface.createTable = (tableName, attributes, options) =>
    originalCreateTable(
      tableInSchema(tableName, schemaName),
      attributes,
      withSchema(options, schemaName),
    );

  const originalDropTable = queryInterface.dropTable.bind(queryInterface);
  queryInterface.dropTable = (tableName, options) =>
    originalDropTable(
      tableInSchema(tableName, schemaName),
      withSchema(options, schemaName),
    );

  const originalBulkInsert = queryInterface.bulkInsert.bind(queryInterface);
  queryInterface.bulkInsert = (tableName, records, options) =>
    originalBulkInsert(
      tableInSchema(tableName, schemaName),
      records,
      withSchema(options, schemaName),
    );

  const originalAddIndex = queryInterface.addIndex.bind(queryInterface);
  queryInterface.addIndex = async (tableName, attributes, options = {}) => {
    if (!Array.isArray(attributes)) {
      options = attributes || {};
      attributes = options.fields;
    }
    const fields = [].concat(attributes || []);
    const opts = withSchema(options, schemaName);
    const rawName = typeof tableName === "string" ? tableName : tableName.tableName;
    const baseName = opts.name || `${rawName}_${fields.join("_")}`;
    opts.name = `${prefix}${baseName}`;
    return originalAddIndex(tableInSchema(tableName, schemaName), fields, opts);
  };

  const originalChangeColumn = queryInterface.changeColumn.bind(queryInterface);
  queryInterface.changeColumn = (tableName, attributeName, dataTypeOrOptions, options) =>
    originalChangeColumn(
      tableInSchema(tableName, schemaName),
      attributeName,
      dataTypeOrOptions,
      withSchema(options, schemaName),
    );

  const originalAddConstraint = queryInterface.addConstraint.bind(queryInterface);
  queryInterface.addConstraint = async (tableName, options = {}) => {
    const opts = withSchema(options, schemaName);
    if (opts.name) opts.name = `${prefix}${opts.name}`;
    return originalAddConstraint(tableInSchema(tableName, schemaName), opts);
  };

  return queryInterface;
}

/**
 * Run all POS migrations inside a tenant schema.
 * Each tenant gets its own SequelizeMeta + copy of POS tables.
 */
async function runTenantMigrations(sequelize, schemaName) {
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
  await setTenantSearchPath(sequelize, schemaName);
  await ensureMetaTable(sequelize, schemaName);

  const migrationsDir = path.join(__dirname, "../migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".js"))
    .sort();

  const executed = await getExecutedMigrations(sequelize, schemaName);
  const pending = files.filter((file) => !executed.has(file));
  const queryInterface = patchQueryInterfaceForTenant(
    sequelize.getQueryInterface(),
    schemaName,
  );

  for (const file of pending) {
    await setTenantSearchPath(sequelize, schemaName);
    const migrationPath = path.join(migrationsDir, file);
    delete require.cache[require.resolve(migrationPath)];
    const migration = require(migrationPath);
    await migration.up(queryInterface, Sequelize);
    await sequelize.query(
      `INSERT INTO ${metaTable(schemaName)} (name) VALUES (:name)`,
      { replacements: { name: file } },
    );
  }

  return { applied: pending.length, pending };
}

module.exports = { runTenantMigrations, setTenantSearchPath };
