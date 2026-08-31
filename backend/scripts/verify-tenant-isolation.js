#!/usr/bin/env node
"use strict";

/**
 * Prove cafe A and cafe B do not share POS data.
 *
 * 1. Ensure tenants `demo` and `brew` exist
 * 2. Compare users in each schema
 * 3. If API is up, try logins with the wrong X-Tenant-Slug (must fail)
 *
 * Example:
 *   npm run verify:tenants
 */

require("dotenv").config();

const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require("../configs/db-config.js")[env];
const { provisionTenant } = require("../lib/tenant-provisioner");
const { ensureDefaultCashAccount } = require("../lib/run-tenant-seeders");

const API = `http://127.0.0.1:${process.env.PORT || 8080}`;

const CAFES = [
  {
    slug: "demo",
    name: "Demo Cafe",
    email: "owner@demo.com",
    username: "owner",
    password: "admin123",
  },
  {
    slug: "brew",
    name: "Brew Cafe",
    email: "owner@brew.com",
    username: "lasta",
    password: "brewpass123",
  },
];

function fail(message) {
  console.error(`FAIL  ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`OK    ${message}`);
}

async function ensureTenant(sequelize, cafe) {
  const [rows] = await sequelize.query(
    `SELECT slug, "schemaName", status FROM public.tenants WHERE slug = :slug`,
    { replacements: { slug: cafe.slug } },
  );
  if (rows[0]) {
    console.log(`Tenant ${cafe.slug} already exists (${rows[0].status}).`);
    return rows[0];
  }

  console.log(`Provisioning ${cafe.slug}...`);
  const result = await provisionTenant({
    slug: cafe.slug,
    name: cafe.name,
    email: cafe.email,
    password: cafe.password,
    trialDays: 14,
  });
  console.log(`Provisioned ${cafe.slug} → ${result.schemaName}`);
  return {
    slug: result.slug,
    schemaName: result.schemaName,
    status: result.status,
  };
}

async function usersInSchema(sequelize, schemaName) {
  const [rows] = await sequelize.query(
    `SELECT id, username, email, "roleId" FROM "${schemaName}".users ORDER BY id`,
  );
  return rows;
}

async function ensureOwnerIsSuperAdmin(sequelize, schemaName, ownerEmail) {
  await sequelize.query(
    `UPDATE "${schemaName}".users SET "roleId" = 1 WHERE email = :email AND "roleId" != 1`,
    { replacements: { email: ownerEmail } },
  );
}

async function profileWithToken(token, slug) {
  const res = await fetch(`${API}/api/v1/auth/profile`, {
    headers: {
      Authorization: `Admin ${token}`,
      "X-Tenant-Slug": slug,
    },
  });
  return res.json();
}

async function login(username, password, slug) {
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Slug": slug,
    },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

async function apiUp() {
  try {
    const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    { ...config, logging: false },
  );

  try {
    const demo = await ensureTenant(sequelize, CAFES[0]);
    const brew = await ensureTenant(sequelize, CAFES[1]);

    const demoUsers = await usersInSchema(sequelize, demo.schemaName);
    const brewUsers = await usersInSchema(sequelize, brew.schemaName);

    console.log("\n--- schema users ---");
    console.log("demo:", demoUsers);
    console.log("brew:", brewUsers);

    const demoEmails = new Set(demoUsers.map((u) => u.email));
    const brewEmails = new Set(brewUsers.map((u) => u.email));
    const overlap = [...demoEmails].filter((e) => brewEmails.has(e));

    if (overlap.length) {
      fail(`same email in both cafes: ${overlap.join(", ")}`);
    } else {
      ok("no shared user emails between demo and brew");
    }

    if (!demoEmails.has("owner@demo.com")) {
      fail("demo schema missing owner@demo.com");
    } else {
      ok("demo has its own owner");
    }

    if (!brewEmails.has("owner@brew.com")) {
      fail("brew schema missing owner@brew.com");
    } else {
      ok("brew has its own owner");
    }

    await ensureOwnerIsSuperAdmin(sequelize, demo.schemaName, "owner@demo.com");
    await ensureOwnerIsSuperAdmin(sequelize, brew.schemaName, "owner@brew.com");
    await ensureDefaultCashAccount(sequelize, demo.schemaName);
    await ensureDefaultCashAccount(sequelize, brew.schemaName);

    const demoOwner = demoUsers.find((u) => u.email === "owner@demo.com");
    const brewOwner = brewUsers.find((u) => u.email === "owner@brew.com");

    const [publicHasBrew] = await sequelize.query(
      `SELECT email FROM public.users WHERE email = 'owner@brew.com'`,
    );
    if (publicHasBrew.length) {
      fail("brew owner leaked into public.users");
    } else {
      ok("brew owner is not in public.users");
    }

    if (await apiUp()) {
      console.log("\n--- HTTP logins ---");
      const demoOk = await login(
        demoOwner?.username || CAFES[0].username,
        CAFES[0].password,
        "demo",
      );
      const brewOk = await login(
        brewOwner?.username || CAFES[1].username,
        CAFES[1].password,
        "brew",
      );
      const demoPwOnBrew = await login(
        demoOwner?.username || CAFES[0].username,
        CAFES[0].password,
        "brew",
      );
      const brewPwOnDemo = await login(
        brewOwner?.username || CAFES[1].username,
        CAFES[1].password,
        "demo",
      );

      demoOk.success ? ok("demo owner logs into demo") : fail("demo owner should log into demo");
      brewOk.success ? ok("brew owner logs into brew") : fail("brew owner should log into brew");

      demoOk.data?.slug === "demo"
        ? ok("demo JWT contains slug=demo")
        : fail(`demo JWT slug is ${demoOk.data?.slug}`);
      brewOk.data?.slug === "brew"
        ? ok("brew JWT contains slug=brew")
        : fail(`brew JWT slug is ${brewOk.data?.slug}`);

      demoPwOnBrew.success
        ? fail("demo password must NOT work on brew")
        : ok("demo password does not work on brew");
      brewPwOnDemo.success
        ? fail("brew password must NOT work on demo")
        : ok("brew password does not work on demo");

      if (demoOk.success && demoOk.data?.token) {
        const crossTenant = await profileWithToken(demoOk.data.token, "brew");
        crossTenant.success
          ? fail("demo JWT must NOT work on brew tenant")
          : ok("demo JWT rejected on brew tenant");
      }
    } else {
      console.log(`\nAPI not running at ${API} — skipped HTTP checks.`);
      console.log("Start the backend and re-run to test login isolation.");
    }

    if (process.exitCode) {
      console.log("\nIsolation check FAILED.");
    } else {
      console.log("\nIsolation check passed.");
    }
  } finally {
    await sequelize.close();
  }
}

main().catch((err) => {
  console.error("verify-tenant-isolation failed:", err.message);
  process.exit(1);
});
