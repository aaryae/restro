"use strict";

const slugify = require("slugify");
const { RESERVED_SLUGS } = require("../constants/tenant-constants");
const { validateSlug, toSchemaName } = require("./tenant-slug");

function suggestSlug(name) {
  const base = slugify(String(name || ""), {
    lower: true,
    strict: true,
    trim: true,
  }).slice(0, 50);

  if (!base) return "cafe";
  if (RESERVED_SLUGS.includes(base)) return `${base}-cafe`;
  return base;
}

async function nextAvailableSlug(tenantModel, name) {
  let candidate = suggestSlug(name);
  let n = 0;

  while (true) {
    const slug = n === 0 ? candidate : `${candidate}-${n}`.slice(0, 63);
    try {
      validateSlug(slug);
    } catch {
      n += 1;
      continue;
    }
    const exists = await tenantModel.findOne({
      where: { slug },
      attributes: ["id"],
    });
    if (!exists) return slug;
    n += 1;
  }
}

module.exports = {
  suggestSlug,
  nextAvailableSlug,
  toSchemaName,
};
