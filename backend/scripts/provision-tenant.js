#!/usr/bin/env node
"use strict";

/**
 * CLI: create a new cafe tenant.
 *
 * Example:
 *   node --env-file .env scripts/provision-tenant.js \
 *     --slug hillside --name "Hillside Cafe" \
 *     --email owner@hillside.com --password admin123
 * 
 * 
 * orther emaple: 
 * pnpm run provision:tenant -- \
  --slug hillside \
  --name "Hillside Cafe" \
  --email owner@hillside.com \
  --password admin123
 */

const { provisionTenant } = require("../lib/tenant-provisioner");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.slug || !args.name || !args.email || !args.password) {
    console.error(`Usage:
  node --env-file .env scripts/provision-tenant.js \\
    --slug <slug> --name "<cafe name>" \\
    --email <owner@email> --password <password> \\
    [--phone 9800000000] [--trial-days 14] [--status trial|active]

Reserved slugs: cafe, admin, www, api, web, ...
`);
    process.exit(1);
  }

  const result = await provisionTenant({
    slug: args.slug,
    name: args.name,
    email: args.email,
    password: args.password,
    phone: args.phone,
    trialDays: args["trial-days"] ? Number(args["trial-days"]) : 14,
    status: args.status,
  });

  console.log("Tenant provisioned successfully:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Provisioning failed:", err.message);
  process.exit(1);
});
