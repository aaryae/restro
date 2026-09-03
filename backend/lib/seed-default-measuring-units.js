"use strict";

/**
 * Restaurant-ready measuring units seeded for every cafe.
 * Matched by slug so re-runs stay idempotent.
 */
const DEFAULT_MEASURING_UNITS = [
  {
    name: "Kilogram",
    symbol: "kg",
    slug: "kilogram",
    description: "Weight for meat, flour, rice, and vegetables.",
  },
  {
    name: "Gram",
    symbol: "g",
    slug: "gram",
    description: "Small weights for spices, garnish, and portions.",
  },
  {
    name: "Liter",
    symbol: "ltr",
    slug: "liter",
    description: "Liquids such as milk, oil, water, and syrups.",
  },
  {
    name: "Milliliter",
    symbol: "ml",
    slug: "milliliter",
    description: "Small liquid measures for sauces and drinks.",
  },
  {
    name: "Piece",
    symbol: "pcs",
    slug: "piece",
    description: "Countable items — buns, eggs, plates, bottles.",
  },
  {
    name: "Packet",
    symbol: "pkt",
    slug: "packet",
    description: "Packaged goods like chips, noodles, and powders.",
  },
  {
    name: "Dozen",
    symbol: "dz",
    slug: "dozen",
    description: "Sets of 12 — eggs, momos, or bakery items.",
  },
  {
    name: "Bottle",
    symbol: "btl",
    slug: "bottle",
    description: "Bottled beverages and condiments.",
  },
  {
    name: "Can",
    symbol: "can",
    slug: "can",
    description: "Canned goods and soft drinks.",
  },
  {
    name: "Box",
    symbol: "box",
    slug: "box",
    description: "Cartons and cases from suppliers.",
  },
];

function queryOptions(schemaName, extra = {}) {
  if (!schemaName) return extra;
  return {
    ...extra,
    // Sequelize prefixes SET search_path on the same connection as the query.
    searchPath: `"${schemaName}", public`,
  };
}

/**
 * Insert any missing default measuring units.
 * Pass schemaName for provisioner/scripts; pass measuringUnitModel under a
 * request that already has tenant search_path context (list API).
 */
async function ensureDefaultMeasuringUnits(
  sequelize,
  { measuringUnitModel, schemaName } = {},
) {
  if (measuringUnitModel) {
    let created = 0;
    for (const unit of DEFAULT_MEASURING_UNITS) {
      const existing = await measuringUnitModel.findOne({
        where: { slug: unit.slug },
      });
      if (existing) {
        if (!existing.description && unit.description) {
          await existing.update({ description: unit.description });
        }
        continue;
      }
      await measuringUnitModel.create(unit);
      created += 1;
    }
    return { created };
  }

  const now = new Date();
  let created = 0;
  const table = schemaName
    ? `"${schemaName}".measuring_units`
    : "measuring_units";

  for (const unit of DEFAULT_MEASURING_UNITS) {
    const [rows] = await sequelize.query(
      `SELECT id, description FROM ${table} WHERE slug = :slug LIMIT 1`,
      queryOptions(schemaName, { replacements: { slug: unit.slug } }),
    );
    if (rows.length) {
      if (!rows[0].description && unit.description) {
        await sequelize.query(
          `UPDATE ${table} SET description = :description, "updatedAt" = :now WHERE id = :id`,
          queryOptions(schemaName, {
            replacements: {
              description: unit.description,
              now,
              id: rows[0].id,
            },
          }),
        );
      }
      continue;
    }
    await sequelize.query(
      `INSERT INTO ${table} (name, symbol, slug, description, "createdAt", "updatedAt")
       VALUES (:name, :symbol, :slug, :description, :now, :now)`,
      queryOptions(schemaName, {
        replacements: {
          name: unit.name,
          symbol: unit.symbol,
          slug: unit.slug,
          description: unit.description,
          now,
        },
      }),
    );
    created += 1;
  }
  return { created };
}

module.exports = {
  DEFAULT_MEASURING_UNITS,
  ensureDefaultMeasuringUnits,
};
