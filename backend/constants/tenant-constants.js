/** Lifecycle states for a cafe tenant (control plane). */
const TENANT_STATUSES = [
  "provisioning",
  "trial",
  "active",
  "expired",
  "suspended",
  "failed",
  "deleted",
];

/** Subdomains that cannot be used as cafe slugs. */
const RESERVED_SLUGS = [
  "cafe",
  "admin",
  "www",
  "api",
  "mail",
  "status",
  "static",
  "web",
];

module.exports = {
  TENANT_STATUSES,
  RESERVED_SLUGS,
};
