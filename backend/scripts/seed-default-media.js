"use strict";

/**
 * Seed packaged default Media photos into one or every cafe.
 *
 * Usage:
 *   pnpm seed:default-media
 *   pnpm seed:default-media -- --email=owner@cafe.com
 */

require("dotenv").config();

const { Sequelize } = require("sequelize");
const { seedDefaultMedia } = require("../lib/seed-default-media");

const env = process.env.NODE_ENV || "development";
const config = require("../configs/db-config.js")[env];

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

async function main() {
  const email = arg("email", null);

  const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    { ...config, logging: false },
  );

  try {
    let tenants;
    if (email) {
      const [rows] = await sequelize.query(
        `SELECT id, name, "schemaName", "ownerEmail"
         FROM public.tenants
         WHERE "ownerEmail" ILIKE :email
         ORDER BY id DESC`,
        { replacements: { email: String(email).trim() } },
      );
      tenants = rows;
      if (!tenants.length) {
        throw new Error(`No cafe found for ${email}`);
      }
    } else {
      const [rows] = await sequelize.query(
        `SELECT id, name, "schemaName", "ownerEmail"
         FROM public.tenants
         WHERE status IN ('trial', 'active', 'expired')
           AND "schemaName" IS NOT NULL
         ORDER BY id ASC`,
      );
      tenants = rows;
    }

    if (!tenants.length) {
      console.log("No tenants to seed.");
      return;
    }

    console.log(`Seeding default media into ${tenants.length} cafe(s)…`);

    for (const tenant of tenants) {
      const result = await seedDefaultMedia(sequelize, tenant.schemaName);
      console.log(
        `  ✓ ${tenant.name} (${tenant.schemaName}): +${result.mediaCreated} photos` +
          (result.mediaSkipped
            ? `, ${result.mediaSkipped} already present`
            : "") +
          (result.categoriesCreated
            ? `, +${result.categoriesCreated} folders`
            : ""),
      );
    }

    console.log("Done.");
  } finally {
    await sequelize.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
