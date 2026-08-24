"use strict";

const { AsyncLocalStorage } = require("async_hooks");

const tenantAls = new AsyncLocalStorage();

function getTenantContext() {
  return tenantAls.getStore() || null;
}

function getTenant() {
  return getTenantContext()?.tenant || null;
}

function runWithTenantContext(store, fn) {
  return tenantAls.run(store, fn);
}

/**
 * Inject per-request search_path into every Sequelize query.
 * Requires dialectOptions.prependSearchPath = true (see db-config).
 * Postgres then prefixes: SET search_path to "tenant_x", public; <sql>
 * on the same connection as the query — safe with the connection pool.
 */
function installTenantSearchPathPatch(sequelize) {
  if (sequelize._tenantSearchPathPatched) return;
  sequelize._tenantSearchPathPatched = true;

  const originalQuery = sequelize.query.bind(sequelize);
  sequelize.query = function tenantAwareQuery(sql, options) {
    const ctx = getTenantContext();
    if (ctx?.tenant?.schemaName) {
      const nextOptions =
        options && typeof options === "object" ? { ...options } : {};
      if (!nextOptions.searchPath) {
        nextOptions.searchPath = `"${ctx.tenant.schemaName}", public`;
      }
      return originalQuery(sql, nextOptions);
    }
    return originalQuery(sql, options);
  };
}

module.exports = {
  tenantAls,
  getTenantContext,
  getTenant,
  runWithTenantContext,
  installTenantSearchPathPatch,
};
