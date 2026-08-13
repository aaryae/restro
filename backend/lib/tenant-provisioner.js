"use strict";

require("dotenv").config();

const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require("../configs/db-config.js")[env];
const { validateSlug, toSchemaName } = require("./tenant-slug");
const { runTenantMigrations } = require("./run-tenant-migrations");
const { runTenantSeeders } = require("./run-tenant-seeders");

function buildSequelize() {
  return new Sequelize(config.database, config.username, config.password, {
    ...config,
    logging: false,
  });
}

/**
 * Best-effort cleanup after a failed provision so the slug can be reused.
 */
async function cleanupFailedProvision(sequelize, tenant, schemaName) {
  try {
    await sequelize.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  } catch {
    // Schema may never have been created.
  }

  if (!tenant) return;

  try {
    await tenant.update({
      status: "failed",
      // Free unique slug for retry: keep row for audit.
      slug: `${tenant.slug}-failed-${tenant.id}`.slice(0, 63),
      schemaName: `${schemaName}_failed_${tenant.id}`.slice(0, 63),
    });
  } catch {
    try {
      await tenant.update({ status: "failed" });
    } catch {
      // ignore
    }
  }
}

/**
 * Create a new cafe: tenants row → Postgres schema → POS tables → owner user.
 */
async function provisionTenant(input) {
  const slug = validateSlug(input.slug);
  const schemaName = toSchemaName(slug);
  const sequelize = buildSequelize();

  await sequelize.query(`SET search_path TO public`);

  const db = require("../models");
  const { tenantModel, provisioningJobModel } = db;

  let tenant;
  let job;

  try {
    tenant = await tenantModel.create({
      slug,
      name: input.name,
      schemaName,
      status: "provisioning",
      ownerEmail: input.email,
      ownerPhone: input.phone || null,
      trialEndsAt: input.trialDays
        ? new Date(Date.now() + input.trialDays * 24 * 60 * 60 * 1000)
        : null,
    });

    job = await provisioningJobModel.create({
      tenantId: tenant.id,
      status: "running",
      startedAt: new Date(),
    });

    const migrationResult = await runTenantMigrations(sequelize, schemaName);

    const seedResult = await runTenantSeeders(sequelize, schemaName, {
      email: input.email,
      password: input.password,
      name: input.name,
      firstName: input.firstName,
      lastName: input.lastName,
      mobileNo: input.phone,
      username: input.username,
    });

    const finalStatus = input.status || (input.trialDays ? "trial" : "active");

    await tenant.update({
      status: finalStatus,
      activatedAt: finalStatus === "active" ? new Date() : null,
      businessType: input.businessType || null,
      address: input.address || null,
    });

    await job.update({
      status: "success",
      finishedAt: new Date(),
    });

    await sequelize.query(`SET search_path TO public`);

    return {
      tenantId: tenant.id,
      slug,
      schemaName,
      status: finalStatus,
      ownerUserId: seedResult.ownerUserId,
      migrationsApplied: migrationResult.applied,
    };
  } catch (error) {
    const message =
      error?.parent?.detail ||
      error?.parent?.message ||
      error?.message ||
      "Unknown error";

    if (job) {
      try {
        await job.update({
          status: "failed",
          errorMessage: message,
          finishedAt: new Date(),
        });
      } catch {
        // ignore
      }
    }

    await cleanupFailedProvision(sequelize, tenant, schemaName);

    // Unique slug race → friendly error
    if (
      error?.name === "SequelizeUniqueConstraintError" ||
      error?.original?.code === "23505"
    ) {
      const err = new Error(`Slug "${slug}" is already taken`);
      err.status = 409;
      throw err;
    }

    throw error;
  } finally {
    await sequelize.close();
  }
}

module.exports = { provisionTenant };
