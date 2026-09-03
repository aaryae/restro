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
 *
 * Important: queryInterface is a singleton on the Sequelize instance. Re-patching
 * for each tenant must NOT nest wrappers (that would pin tables to the first
 * schema). We keep the unbound originals and swap the active schema each call.
 */
function patchQueryInterfaceForTenant(queryInterface, schemaName) {
  if (!queryInterface._tenantUnpatched) {
    queryInterface._tenantUnpatched = {
      createTable: queryInterface.createTable.bind(queryInterface),
      dropTable: queryInterface.dropTable.bind(queryInterface),
      bulkInsert: queryInterface.bulkInsert.bind(queryInterface),
      addIndex: queryInterface.addIndex.bind(queryInterface),
      changeColumn: queryInterface.changeColumn.bind(queryInterface),
      addConstraint: queryInterface.addConstraint.bind(queryInterface),
      addColumn: queryInterface.addColumn.bind(queryInterface),
      removeColumn: queryInterface.removeColumn.bind(queryInterface),
      describeTable: queryInterface.describeTable.bind(queryInterface),
    };
  }

  const original = queryInterface._tenantUnpatched;
  queryInterface._tenantSchema = schemaName;

  const activeSchema = () => queryInterface._tenantSchema;
  const activePrefix = () => `${activeSchema().replace(/-/g, "_")}_`;

  queryInterface.createTable = (tableName, attributes, options) =>
    original.createTable(
      tableInSchema(tableName, activeSchema()),
      attributes,
      withSchema(options, activeSchema()),
    );

  queryInterface.dropTable = (tableName, options) =>
    original.dropTable(
      tableInSchema(tableName, activeSchema()),
      withSchema(options, activeSchema()),
    );

  queryInterface.bulkInsert = (tableName, records, options) =>
    original.bulkInsert(
      tableInSchema(tableName, activeSchema()),
      records,
      withSchema(options, activeSchema()),
    );

  queryInterface.addIndex = async (tableName, attributes, options = {}) => {
    if (!Array.isArray(attributes)) {
      options = attributes || {};
      attributes = options.fields;
    }
    const fields = [].concat(attributes || []);
    const opts = withSchema(options, activeSchema());
    const rawName = typeof tableName === "string" ? tableName : tableName.tableName;
    const baseName = opts.name || `${rawName}_${fields.join("_")}`;
    opts.name = `${activePrefix()}${baseName}`;
    return original.addIndex(tableInSchema(tableName, activeSchema()), fields, opts);
  };

  queryInterface.changeColumn = (
    tableName,
    attributeName,
    dataTypeOrOptions,
    options,
  ) =>
    original.changeColumn(
      tableInSchema(tableName, activeSchema()),
      attributeName,
      dataTypeOrOptions,
      withSchema(options, activeSchema()),
    );

  queryInterface.addConstraint = async (tableName, options = {}) => {
    const opts = withSchema(options, activeSchema());
    if (opts.name) opts.name = `${activePrefix()}${opts.name}`;
    return original.addConstraint(tableInSchema(tableName, activeSchema()), opts);
  };

  queryInterface.addColumn = (tableName, key, attribute, options) =>
    original.addColumn(
      tableInSchema(tableName, activeSchema()),
      key,
      attribute,
      withSchema(options, activeSchema()),
    );

  queryInterface.removeColumn = (tableName, attribute, options) =>
    original.removeColumn(
      tableInSchema(tableName, activeSchema()),
      attribute,
      withSchema(options, activeSchema()),
    );

  queryInterface.describeTable = (tableName, options) =>
    original.describeTable(tableName, withSchema(options, activeSchema()));

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
