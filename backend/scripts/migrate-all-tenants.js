#!/usr/bin/env node
"use strict";

/**
 * Apply pending POS migrations to every cafe schema.
 *
 * public (your current cafe) still uses:  npm run migrate
 * each tenant_* schema uses this script.
 *
 * Example:
 *   npm run migrate:tenants
 */

require("dotenv").config();

const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require("../configs/db-config.js")[env];
const { runTenantMigrations } = require("../lib/run-tenant-migrations");

const SKIP_STATUSES = new Set(["deleted"]);

async function main() {
  const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    { ...config, logging: false },
  );

  try {
    const [tenants] = await sequelize.query(`
      SELECT id, slug, "schemaName", status
      FROM public.tenants
      ORDER BY id
    `);

    if (tenants.length === 0) {
      console.log("No tenants found. Nothing to migrate.");
      return;
    }

    console.log(`Found ${tenants.length} tenant(s).\n`);

    for (const tenant of tenants) {
      if (SKIP_STATUSES.has(tenant.status)) {
        console.log(`- skip ${tenant.slug} (status: ${tenant.status})`);
        continue;
      }

      const result = await runTenantMigrations(sequelize, tenant.schemaName);
      console.log(
        `- ${tenant.slug} (${tenant.schemaName}): applied ${result.applied} migration(s)`,
      );
    }
  } finally {
    await sequelize.query("SET search_path TO public");
    await sequelize.close();
  }
}

main().catch((err) => {
  console.error("migrate-all-tenants failed:", err.message);
  process.exit(1);
});
