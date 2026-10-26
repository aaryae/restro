"use strict";

/**
 * Demo inventory for testing unit breakdown and menu recipes.
 *
 *   node scripts/seed-inventory-demo.js
 *   node scripts/seed-inventory-demo.js --email=owner@cafe.com
 *
 * Safe to run again. Existing quantities are left as they are.
 * Chicken momo (or a new one) uses dough, salt, and meat.
 * Cigarette uses 1 piece. Cigarette Packet uses 1 packet.
 * Cigarette stock is 2 dozen = 24 packet = 480 piece, with
 * 1 packet = 20 piece and 1 dozen = 12 packet.
 */

require("dotenv").config();

const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const {
  ensureDefaultMeasuringUnits,
} = require("../lib/seed-default-measuring-units");
const {
  installTenantSearchPathPatch,
  runWithTenantContext,
} = require("../lib/tenant-context");

const env = process.env.NODE_ENV || "development";
const config = require("../configs/db-config.js")[env];

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((entry) => entry.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

const STOCK = [
  {
    slug: "recipe-dough",
    name: "Dough",
    unit: "gram",
    group: "kitchen",
    quantity: 5000,
    price: 0.08,
    threshold: 500,
  },
  {
    slug: "recipe-salt",
    name: "Salt",
    unit: "gram",
    group: "kitchen",
    quantity: 2000,
    price: 0.02,
    threshold: 100,
  },
  {
    slug: "recipe-meat",
    name: "Meat",
    unit: "gram",
    group: "kitchen",
    quantity: 8000,
    price: 0.9,
    threshold: 1000,
  },
  {
    slug: "recipe-cigarette",
    name: "Cigarette",
    unit: "piece",
    group: "retail",
    quantity: 480,
    price: 15,
    threshold: 40,
    units: [
      { unit: "packet", of: "piece", factor: 20 },
      { unit: "dozen", of: "packet", factor: 12 },
    ],
  },
];

async function main() {
  const email = arg("email", null);
  const {
    sequelize,
    stockItemModel,
    stockItemUnitModel,
    stockHistoryModel,
    stockGroupModel,
    measuringUnitModel,
    productModel,
    productCategoryModel,
    productRecipeModel,
    departmentModel,
  } = require("../models");
  installTenantSearchPathPatch(sequelize);
  sequelize.options.logging = false;

  const connection = new Sequelize(
    config.database,
    config.username,
    config.password,
    { ...config, logging: false },
  );

  try {
    const tenants = await loadTenants(connection, email);
    if (!tenants.length) {
      console.log("No cafes to seed.");
      return;
    }

    const targets = tenants.map((tenant) => ({
      name: tenant.name,
      schemaName: tenant.schemaName,
    }));
    const [publicStock] = await connection.query(
      `SELECT to_regclass('public.stock_items') AS present`,
    );
    if (publicStock[0]?.present && !targets.some((row) => row.schemaName === "public")) {
      targets.push({ name: "Public cafe", schemaName: "public" });
    }

    for (const tenant of targets) {
      await ensureDefaultMeasuringUnits(connection, {
        schemaName: tenant.schemaName,
      });
      const summary = await runWithTenantContext(
        { tenant: { schemaName: tenant.schemaName } },
        () =>
          sequelize.transaction((transaction) =>
            seedTenant({
              transaction,
              stockItemModel,
              stockItemUnitModel,
              stockHistoryModel,
              stockGroupModel,
              measuringUnitModel,
              productModel,
              productCategoryModel,
              productRecipeModel,
              departmentModel,
            }),
          ),
      );
      console.log(
        `  ✓ ${tenant.name} (${tenant.schemaName}): ${summary.stock} stock items ready, ${summary.recipes} new recipe lines`,
      );
    }
    console.log("Done.");
  } finally {
    await connection.close();
    await sequelize.close();
  }
}

async function loadTenants(connection, email) {
  if (email) {
    const [rows] = await connection.query(
      `SELECT id, name, "schemaName", "ownerEmail"
       FROM public.tenants
       WHERE "ownerEmail" ILIKE :email
       ORDER BY id DESC`,
      { replacements: { email: String(email).trim() } },
    );
    if (!rows.length) throw new Error(`No cafe found for ${email}`);
    return rows;
  }
  const [rows] = await connection.query(
    `SELECT id, name, "schemaName", "ownerEmail"
     FROM public.tenants
     WHERE status IS DISTINCT FROM 'deleted'
       AND "schemaName" IS NOT NULL
     ORDER BY id ASC`,
  );
  return rows;
}

async function seedTenant(models) {
  const { transaction } = models;
  const units = await measuringUnits(models);
  const groups = {
    kitchen: await ensureGroup(models, "Kitchen", "kitchen"),
    retail: await ensureGroup(models, "Retail", "retail"),
  };

  const stockBySlug = {};
  let stockCount = 0;
  for (const spec of STOCK) {
    stockBySlug[spec.slug] = await ensureStock(models, spec, units, groups);
    stockCount += 1;
  }

  const category = await ensureCategory(models);
  const department = await ensureDepartment(models);
  const momos = await models.productModel.findAll({
    where: {
      [Op.and]: [
        { name: { [Op.iLike]: "%momo%" } },
        { name: { [Op.notILike]: "%veg%" } },
      ],
    },
    transaction,
  });
  const products = [...momos];
  if (!products.length) {
    products.push(
      await ensureProduct(models, {
        name: "Chicken Momo",
        slug: "chicken-momo",
        price: 250,
        categoryId: category.id,
        departmentId: department?.id || null,
        description: "One plate. Uses dough, salt, and meat from inventory.",
      }),
    );
  }
  products.push(
    await ensureProduct(models, {
      name: "Cigarette",
      slug: "cigarette",
      price: 30,
      categoryId: category.id,
      departmentId: department?.id || null,
      description: "One piece. Reduces piece, packet, and dozen on hand.",
    }),
  );
  products.push(
    await ensureProduct(models, {
      name: "Cigarette Packet",
      slug: "cigarette-packet",
      price: 400,
      categoryId: category.id,
      departmentId: department?.id || null,
      description: "One packet (20 pieces).",
    }),
  );

  const recipePlan = [
    ...products
      .filter((product) => /momo/i.test(product.name))
      .flatMap((product) => [
        recipe(product, stockBySlug["recipe-dough"], units.gram, 80),
        recipe(product, stockBySlug["recipe-salt"], units.gram, 5),
        recipe(product, stockBySlug["recipe-meat"], units.gram, 500),
      ]),
    recipe(
      products.find((product) => product.slug === "cigarette"),
      stockBySlug["recipe-cigarette"],
      units.piece,
      1,
    ),
    recipe(
      products.find((product) => product.slug === "cigarette-packet"),
      stockBySlug["recipe-cigarette"],
      units.packet,
      1,
    ),
  ].filter((row) => row.productId && row.stockItemId);

  let recipeCount = 0;
  for (const row of recipePlan) {
    const existing = await models.productRecipeModel.findOne({
      where: { productId: row.productId, stockItemId: row.stockItemId },
      transaction,
    });
    if (existing) continue;
    await models.productRecipeModel.create(row, { transaction });
    recipeCount += 1;
  }

  return { stock: stockCount, products: products.length, recipes: recipeCount };
}

function recipe(product, stockItem, unit, quantity) {
  return {
    productId: product?.id,
    stockItemId: stockItem?.id,
    measuringUnitId: unit?.id,
    quantity,
  };
}

async function measuringUnits({ measuringUnitModel, transaction }) {
  const rows = await measuringUnitModel.findAll({
    where: { slug: ["gram", "piece", "packet", "dozen"] },
    transaction,
  });
  const bySlug = Object.fromEntries(rows.map((unit) => [unit.slug, unit]));
  for (const slug of ["gram", "piece", "packet", "dozen"]) {
    if (!bySlug[slug]) {
      throw new Error(`Measuring unit "${slug}" is missing`);
    }
  }
  return bySlug;
}

async function ensureGroup(models, name, slug) {
  const found = await models.stockGroupModel.findOne({
    where: { slug },
    transaction: models.transaction,
  });
  if (found) return found;
  return models.stockGroupModel.create(
    { name, slug, description: "Demo inventory group" },
    { transaction: models.transaction },
  );
}

async function ensureStock(models, spec, units, groups) {
  const { transaction } = models;
  let item = await models.stockItemModel.findOne({
    where: { slug: spec.slug },
    transaction,
  });
  if (!item) {
    item = await models.stockItemModel.create(
      {
        name: spec.name,
        slug: spec.slug,
        measuringUnitId: units[spec.unit].id,
        stockGroupId: groups[spec.group].id,
        defaultPrice: spec.price,
        openingQuantity: spec.quantity,
        quantity: spec.quantity,
        lowStockThreshold: spec.threshold,
      },
      { transaction },
    );
    await models.stockHistoryModel.create(
      {
        stockItemId: item.id,
        type: "opening",
        quantity: spec.quantity,
        rate: spec.price,
        value: spec.quantity * spec.price,
        note: "Opening stock",
        createdBy: null,
      },
      { transaction },
    );
  }

  if (spec.units) {
    const existingLevels = await models.stockItemUnitModel.count({
      where: { stockItemId: item.id },
      transaction,
    });
    if (existingLevels === 0) {
      let level = 1;
      let factorToBase = 1;
      for (const row of spec.units) {
        factorToBase *= row.factor;
        await models.stockItemUnitModel.create(
          {
            stockItemId: item.id,
            measuringUnitId: units[row.unit].id,
            ofUnitId: units[row.of].id,
            factor: row.factor,
            factorToBase,
            level,
          },
          { transaction },
        );
        level += 1;
      }
    }
  }
  return item;
}

async function ensureCategory(models) {
  const found = await models.productCategoryModel.findOne({
    order: [["id", "ASC"]],
    transaction: models.transaction,
  });
  if (found) return found;
  return models.productCategoryModel.create(
    {
      name: "Food",
      slug: "food",
      description: "Demo category",
      order: 0,
    },
    { transaction: models.transaction },
  );
}

async function ensureDepartment(models) {
  const found = await models.departmentModel.findOne({
    order: [["id", "ASC"]],
    transaction: models.transaction,
  });
  if (found) return found;
  return models.departmentModel.create(
    {
      name: "Kitchen",
      slug: "kitchen",
      description: "Demo department",
      isActive: true,
      displayOrder: 0,
    },
    { transaction: models.transaction },
  );
}

async function ensureProduct(models, spec) {
  const found = await models.productModel.findOne({
    where: { slug: spec.slug },
    transaction: models.transaction,
  });
  if (found) return found;
  return models.productModel.create(
    {
      name: spec.name,
      slug: spec.slug,
      price: spec.price,
      productCategoryId: spec.categoryId,
      departmentId: spec.departmentId,
      description: spec.description,
      quantity: 100,
      order: 0,
      hasVariant: false,
      stockStatus: "in_stock",
    },
    { transaction: models.transaction },
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
