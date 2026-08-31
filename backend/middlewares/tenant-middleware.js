"use strict";

const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const { tenantModel } = require("../models");
const { resolveTenantSlug } = require("../lib/resolve-tenant-from-host");
const {
  runWithTenantContext,
  installTenantSearchPathPatch,
} = require("../lib/tenant-context");
const { sequelize } = require("../models");
const {
  buildUnavailablePayload,
  isTrialLifecyclePath,
} = require("../lib/trial-lifecycle");

const ALLOWED_STATUSES = new Set(["trial", "active"]);

installTenantSearchPathPatch(sequelize);

/**
 * Part 3 — resolve cafe from Host / X-Tenant-Slug, then bind this request
 * to that Postgres schema via Sequelize searchPath (see tenant-context).
 *
 * Local/legacy: no slug → leave search_path on public (current single-cafe DB).
 */
async function tenantMiddleware(req, res, next) {
  // Platform control-plane APIs always use public schema — never resolve Host as a cafe.
  // (Host serveapi.* would otherwise become slug "serveapi" → "Unknown cafe".)
  const url = `${req.baseUrl || ""}${req.path || ""}`;
  const auth = String(req.headers.authorization || "");
  if (
    url.includes("/platform") ||
    /\/v1\/trial(?:\/|$)/.test(url) ||
    auth.startsWith("Platform ") ||
    auth.startsWith("Trial ")
  ) {
    req.tenant = null;
    return next();
  }

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

  // Lazy-expire trials whose window has passed (cron also flips status).
  if (
    tenant.status === "trial" &&
    tenant.trialEndsAt &&
    new Date(tenant.trialEndsAt).getTime() < Date.now()
  ) {
    try {
      await tenantModel.update(
        { status: "expired" },
        { where: { id: tenant.id, status: "trial" } },
      );
      tenant = { ...tenant, status: "expired" };
    } catch {
      tenant = { ...tenant, status: "expired" };
    }
  }

  const tenantCtx = {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    schemaName: tenant.schemaName,
    status: tenant.status,
    trialEndsAt: tenant.trialEndsAt || null,
    selfServeTrialExtendedAt: tenant.selfServeTrialExtendedAt || null,
  };

  // Lifecycle endpoints (status / self-extend) must work while expired so POS
  // can show the extend modal or the finished screen.
  if (!ALLOWED_STATUSES.has(tenant.status)) {
    if (isTrialLifecyclePath(url)) {
      req.tenant = tenantCtx;
      req.tenantUnavailable = true;
      return runWithTenantContext({ tenant: req.tenant }, () => next());
    }

    const payload = buildUnavailablePayload(tenant);
    return responseHelper.sendResponse(
      res,
      httpStatus.FORBIDDEN,
      false,
      payload,
      null,
      payload.message,
      null,
    );
  }

  req.tenant = tenantCtx;

  // AsyncLocalStorage survives Express next() + async/await in Node
  runWithTenantContext({ tenant: req.tenant }, () => next());
}

module.exports = tenantMiddleware;
