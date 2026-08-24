"use strict";

require("dotenv").config();

const { Sequelize } = require("sequelize");
const { hashPassword } = require("../utils/bcrypt");
const { ensureDefaultCashAccount } = require("../lib/run-tenant-seeders");

const env = process.env.NODE_ENV || "development";
const config = require("../configs/db-config.js")[env];

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

const PRODUCTS = [
  { name: "Espresso", slug: "espresso", price: 150, category: "coffee" },
  { name: "Americano", slug: "americano", price: 180, category: "coffee" },
  { name: "Cappuccino", slug: "cappuccino", price: 220, category: "coffee" },
  { name: "Cafe Latte", slug: "cafe-latte", price: 240, category: "coffee" },
  { name: "Mocha", slug: "mocha", price: 260, category: "coffee" },
  { name: "Iced Latte", slug: "iced-latte", price: 250, category: "coffee" },
  { name: "Chicken Momo", slug: "chicken-momo", price: 280, category: "food" },
  { name: "Veg Momo", slug: "veg-momo", price: 240, category: "food" },
  { name: "French Fries", slug: "french-fries", price: 180, category: "food" },
  { name: "Club Sandwich", slug: "club-sandwich", price: 320, category: "food" },
  { name: "Chocolate Cake", slug: "chocolate-cake", price: 200, category: "food" },
  { name: "Fresh Lime Soda", slug: "fresh-lime-soda", price: 140, category: "drinks" },
  { name: "Mango Smoothie", slug: "mango-smoothie", price: 220, category: "drinks" },
  { name: "Mineral Water", slug: "mineral-water", price: 50, category: "drinks" },
];

async function main() {
  const email = String(arg("email", "lasta@gmail.com")).trim().toLowerCase();
  const password = String(arg("password", "Lasta@123"));
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config,
    logging: false,
  });

  try {
    const [tenants] = await sequelize.query(
      `SELECT id, name, slug, "schemaName", status, "ownerEmail"
       FROM public.tenants
       WHERE "ownerEmail" ILIKE :email
       ORDER BY id DESC
       LIMIT 1`,
      { replacements: { email } },
    );
    const tenant = tenants[0];
    if (!tenant) {
      throw new Error(`No cafe found for ${email}`);
    }

    const schema = tenant.schemaName;
    const now = new Date();
    const passwordHash = await hashPassword(password);

    const [users] = await sequelize.query(
      `UPDATE "${schema}".users
       SET password = :passwordHash, "updatedAt" = :now
       WHERE email ILIKE :email
       RETURNING id, username, email`,
      { replacements: { passwordHash, now, email } },
    );
    const owner = users[0];
    if (!owner) {
      throw new Error(`No POS user found for ${email} in ${schema}`);
    }

    await sequelize.query(
      `UPDATE "${schema}".settings
       SET brand_name = :name, email = :email, "updatedAt" = :now
       WHERE id IN (SELECT id FROM "${schema}".settings ORDER BY id LIMIT 1)`,
      { replacements: { name: tenant.name, email: tenant.ownerEmail, now } },
    );

    await ensureDefaultCashAccount(sequelize, schema);

    const [floorCount] = await sequelize.query(
      `SELECT count(*)::int AS n FROM "${schema}".floors`,
    );
    if (!floorCount[0].n) {
      const floors = [
        { no: "1", name: "Ground Floor" },
        { no: "2", name: "First Floor" },
      ];
      for (const floor of floors) {
        const [created] = await sequelize.query(
          `INSERT INTO "${schema}".floors
            ("floorNo", name, "isActive", "createdAt", "updatedAt")
           VALUES (:no, :name, true, :now, :now)
           RETURNING id`,
          { replacements: { no: floor.no, name: floor.name, now } },
        );
        const floorId = created[0].id;
        const tables =
          floor.no === "1"
            ? [
                ["T1", "regular", 4],
                ["T2", "regular", 4],
                ["T3", "regular", 6],
                ["T4", "vip", 8],
              ]
            : [
                ["T5", "outdoor", 4],
                ["T6", "outdoor", 4],
                ["T7", "regular", 6],
              ];
        for (const [tableNo, type, capacity] of tables) {
          await sequelize.query(
            `INSERT INTO "${schema}".tables
              ("floorId", "tableNo", type, capacity, status, "createdAt", "updatedAt")
             VALUES (:floorId, :tableNo, :type, :capacity, 'available', :now, :now)`,
            { replacements: { floorId, tableNo, type, capacity, now } },
          );
        }
      }
    }

    const [deptCount] = await sequelize.query(
      `SELECT count(*)::int AS n FROM "${schema}".departments`,
    );
    if (!deptCount[0].n) {
      await sequelize.query(
        `INSERT INTO "${schema}".departments
          (name, slug, description, "isActive", "AvgPreparationTime", "displayOrder", color, "createdAt", "updatedAt")
         VALUES
          ('Kitchen', 'kitchen', 'Hot food', true, 12, 1, '#ea580c', :now, :now),
          ('Bar', 'bar', 'Coffee and drinks', true, 5, 2, '#0284c7', :now, :now)`,
        { replacements: { now } },
      );
    }

    const [catCount] = await sequelize.query(
      `SELECT count(*)::int AS n FROM "${schema}".product_categories`,
    );
    if (!catCount[0].n) {
      await sequelize.query(
        `INSERT INTO "${schema}".product_categories
          (name, slug, description, "order", "loyaltyRequired", "createdAt", "updatedAt")
         VALUES
          ('Coffee', 'coffee', 'Hot and iced coffee', 1, 0, :now, :now),
          ('Food', 'food', 'Kitchen items', 2, 0, :now, :now),
          ('Drinks', 'drinks', 'Cold drinks', 3, 0, :now, :now)`,
        { replacements: { now } },
      );
    }

    const [prodCount] = await sequelize.query(
      `SELECT count(*)::int AS n FROM "${schema}".products`,
    );
    if (!prodCount[0].n) {
      const [depts] = await sequelize.query(
        `SELECT id, slug FROM "${schema}".departments`,
      );
      const [cats] = await sequelize.query(
        `SELECT id, slug FROM "${schema}".product_categories`,
      );
      const deptBySlug = Object.fromEntries(depts.map((d) => [d.slug, d.id]));
      const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

      let order = 1;
      for (const item of PRODUCTS) {
        const departmentId =
          item.category === "food" ? deptBySlug.kitchen : deptBySlug.bar;
        const productCategoryId = catBySlug[item.category];
        await sequelize.query(
          `INSERT INTO "${schema}".products
            ("productCategoryId", "departmentId", name, slug, description, quantity,
             "order", price, "stockStatus", "reservedQuantity", "hasVariant",
             "createdAt", "updatedAt")
           VALUES
            (:productCategoryId, :departmentId, :name, :slug, :description, 100,
             :order, :price, 'in_stock', 0, false, :now, :now)`,
          {
            replacements: {
              productCategoryId,
              departmentId,
              name: item.name,
              slug: item.slug,
              description: `Demo ${item.name}`,
              order,
              price: item.price,
              now,
            },
          },
        );
        order += 1;
      }
    }

    console.log("POS demo data ready:");
    console.log(`  cafe:     ${tenant.name}`);
    console.log(`  slug:     ${tenant.slug}`);
    console.log(`  url:      http://localhost:7001/?tenant=${tenant.slug}`);
    console.log(`  username: ${owner.username}`);
    console.log(`  email:    ${owner.email}`);
    console.log(`  password: ${password}`);
  } finally {
    await sequelize.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
