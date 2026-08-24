const { RESERVED_SLUGS } = require("../constants/tenant-constants");

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function toSchemaName(slug) {
  return `tenant_${slug.replace(/-/g, "_")}`;
}

function validateSlug(slug) {
  if (!slug || typeof slug !== "string") {
    throw new Error("Slug is required.");
  }

  const normalized = slug.trim().toLowerCase();

  if (!SLUG_PATTERN.test(normalized)) {
    throw new Error(
      "Slug must be 1–63 chars, lowercase letters, numbers, hyphens; no leading/trailing hyphen.",
    );
  }

  if (RESERVED_SLUGS.includes(normalized)) {
    throw new Error(`Slug "${normalized}" is reserved and cannot be used.`);
  }

  return normalized;
}

module.exports = {
  toSchemaName,
  validateSlug,
};
