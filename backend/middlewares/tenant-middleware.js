"use strict";

const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const { tenantModel, sequelize } = require("../models");
const { resolveTenantSlug } = require("../lib/resolve-tenant-from-host");
const {
  runWithTenantContext,
  installTenantSearchPathPatch,
} = require("../lib/tenant-context");

const ALLOWED_STATUSES = new Set(["trial", "active"]);

installTenantSearchPathPatch(sequelize);

/**
 * Part 3 — resolve cafe from Host / X-Tenant-Slug, then bind this request
 * to that Postgres schema via Sequelize searchPath (see tenant-context).
 *
 * Local/legacy: no slug → leave search_path on public (current single-cafe DB).
 */
async function tenantMiddleware(req, res, next) {
  const slug = resolveTenantSlug(req);

  if (!slug) {
    req.tenant = null;
    return next();
  }

  let tenant;
  try {
    // Model pinned to schema: "public"
    tenant = await tenantModel.findOne({
      where: { slug },
      raw: true,
    });
  } catch (err) {
    return next(err);
  }

  if (!tenant) {
    return responseHelper.sendResponse(
      res,
      httpStatus.NOT_FOUND,
      false,
      null,
      null,
      `Unknown cafe "${slug}".`,
      null,
    );
  }

  if (!ALLOWED_STATUSES.has(tenant.status)) {
    return responseHelper.sendResponse(
      res,
      httpStatus.FORBIDDEN,
      false,
      null,
      null,
      `Cafe "${slug}" is not available (status: ${tenant.status}).`,
      null,
    );
  }

  req.tenant = {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    schemaName: tenant.schemaName,
    status: tenant.status,
  };

  // AsyncLocalStorage survives Express next() + async/await in Node
  runWithTenantContext({ tenant: req.tenant }, () => next());
}

module.exports = tenantMiddleware;
