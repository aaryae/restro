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

    await runTenantSeeders(sequelize, schemaName, {
      email: input.email,
      password: input.password,
      name: input.name,
      firstName: input.firstName,
      lastName: input.lastName,
      mobileNo: input.phone,
    });

    const finalStatus = input.status || (input.trialDays ? "trial" : "active");

    await tenant.update({
      status: finalStatus,
      activatedAt: finalStatus === "active" ? new Date() : null,
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
      migrationsApplied: migrationResult.applied,
    };
  } catch (error) {
    const message =
      error?.parent?.detail ||
      error?.parent?.message ||
      error?.message ||
      "Unknown error";

    if (job) {
      await job.update({
        status: "failed",
        errorMessage: message,
        finishedAt: new Date(),
      });
    }
    if (tenant) {
      await tenant.update({ status: "failed" });
    }
    throw error;
  } finally {
    await sequelize.close();
  }
}

module.exports = { provisionTenant };
