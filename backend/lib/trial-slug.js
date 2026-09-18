"use strict";

const slugify = require("slugify");
const { RESERVED_SLUGS } = require("../constants/tenant-constants");
const { validateSlug, toSchemaName } = require("./tenant-slug");

/** Words that bloat cafe URLs without helping recognition. */
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "of",
  "for",
  "with",
  "to",
  "in",
  "at",
  "on",
  "by",
  "restaurant",
  "restaurants",
  "cafe",
  "cafeteria",
  "kitchen",
  "cloud",
  "food",
  "foods",
  "place",
  "center",
  "centre",
  "hotel",
  "resort",
  "bakery",
  "bar",
  "lounge",
  "private",
  "limited",
  "ltd",
  "pvt",
]);

const MAX_SLUG_LEN = 24;

function tokenizeName(name) {
  const base = slugify(String(name || ""), {
    lower: true,
    strict: true,
    trim: true,
  });
  return base.split("-").filter(Boolean);
}

function joinWords(words, maxLen = MAX_SLUG_LEN) {
  const parts = [];
  for (const word of words) {
    const next = parts.length ? `${parts.join("-")}-${word}` : word;
    if (next.length > maxLen) break;
    parts.push(word);
  }
  return parts.join("-");
}

function finalizeCandidate(raw) {
  let slug = String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
  if (!slug) slug = "cafe";
  if (RESERVED_SLUGS.includes(slug)) slug = `${slug}-cafe`.slice(0, 63);
  return slug;
}

/**
 * Build short, readable slug options from a long restaurant name.
 * e.g. "Burger House and Crunchy Fried Chicken Restaurant"
 *   → burger-house, burger-crunchy, burger-chicken, …
 */
function buildSlugCandidates(name) {
  const all = tokenizeName(name);
  const content = all.filter((w) => !STOP_WORDS.has(w));
  const words = content.length ? content : all;
  const seen = new Set();
  const out = [];

  const push = (value) => {
    const slug = finalizeCandidate(value);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);
    out.push(slug);
  };

  if (!words.length) {
    push("cafe");
    return out;
  }

  // Prefer short distinctive combos first.
  push(joinWords(words.slice(0, 2)));
  push(joinWords(words.slice(0, 3)));
  if (words.length >= 2) {
    push(`${words[0]}-${words[words.length - 1]}`);
  }
  push(words[0]);

  // Initials only when the name is still long.
  if (words.length >= 3) {
    const initials = words
      .map((w) => w[0])
      .join("")
      .slice(0, 8);
    if (initials.length >= 3) push(initials);
  }

  // Fallback: truncated full slugify (legacy behavior, capped shorter).
  push(joinWords(all, MAX_SLUG_LEN));

  return out;
}

function suggestSlug(name) {
  return buildSlugCandidates(name)[0] || "cafe";
}

async function nextAvailableSlug(tenantModel, name) {
  const candidates = buildSlugCandidates(name);
  const tried = new Set();

  for (const base of candidates) {
    for (let n = 0; n < 20; n += 1) {
      const slug = (n === 0 ? base : `${base}-${n}`).slice(0, 63);
      if (tried.has(slug)) continue;
      tried.add(slug);
      try {
        validateSlug(slug);
      } catch {
        continue;
      }
      const exists = await tenantModel.findOne({
        where: { slug },
        attributes: ["id"],
      });
      if (!exists) return slug;
    }
  }

  // Absolute fallback
  let n = Date.now().toString(36).slice(-4);
  return finalizeCandidate(`cafe-${n}`);
}

/**
 * Return several available short options for the UI Suggest control.
 */
async function suggestSlugOptions(tenantModel, name, limit = 4) {
  const candidates = buildSlugCandidates(name);
  const options = [];
  const seen = new Set();

  for (const base of candidates) {
    if (options.length >= limit) break;
    for (let n = 0; n < 12; n += 1) {
      const slug = (n === 0 ? base : `${base}-${n}`).slice(0, 63);
      if (seen.has(slug)) continue;
      seen.add(slug);
      try {
        validateSlug(slug);
      } catch {
        continue;
      }
      const exists = await tenantModel.findOne({
        where: { slug },
        attributes: ["id"],
      });
      if (!exists) {
        options.push(slug);
        break;
      }
    }
  }

  if (!options.length) {
    options.push(await nextAvailableSlug(tenantModel, name || "cafe"));
  }
  return options;
}

module.exports = {
  suggestSlug,
  buildSlugCandidates,
  nextAvailableSlug,
  suggestSlugOptions,
  toSchemaName,
};
