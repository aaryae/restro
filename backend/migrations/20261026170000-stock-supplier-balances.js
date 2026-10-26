"use strict";

/**
 * One remaining quantity per stock item and supplier.
 * supplierId null means stock that was not bought from a supplier.
 * Same item name, ignoring case, is folded into the oldest row.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("stock_supplier_balances", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      stockItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "stock_items", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      supplierId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "suppliers", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      quantity: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX stock_supplier_balances_item_supplier_unique
      ON stock_supplier_balances ("stockItemId", (COALESCE("supplierId", 0)))
    `);

    await queryInterface.addColumn("stock_histories", "supplierSplit", {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      INSERT INTO stock_supplier_balances
        ("stockItemId", "supplierId", quantity, "createdAt", "updatedAt")
      SELECT id, "supplierId", quantity, NOW(), NOW()
      FROM stock_items
      WHERE quantity <> 0
    `);

    await mergeDuplicateNames(queryInterface.sequelize);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("stock_histories", "supplierSplit");
    await queryInterface.dropTable("stock_supplier_balances");
  },
};

async function mergeDuplicateNames(sequelize) {
  const [items] = await sequelize.query(`
    SELECT id, name, "measuringUnitId", quantity, "defaultPrice", "openingQuantity"
    FROM stock_items
    ORDER BY id
  `);
  const groups = new Map();
  for (const item of items) {
    const key = String(item.name || "").trim().toLowerCase();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const keep = group[0];
    for (const dup of group.slice(1)) {
      if (Number(dup.measuringUnitId) !== Number(keep.measuringUnitId)) continue;
      const oldQty = Number(keep.quantity) || 0;
      const addQty = Number(dup.quantity) || 0;
      const nextQty = oldQty + addQty;
      const nextRate =
        nextQty > 0
          ? Math.round(
              ((oldQty * Number(keep.defaultPrice) +
                addQty * Number(dup.defaultPrice)) /
                nextQty) *
                100,
            ) / 100
          : Number(keep.defaultPrice) || 0;
      keep.quantity = nextQty;
      keep.defaultPrice = nextRate;
      keep.openingQuantity =
        (Number(keep.openingQuantity) || 0) + (Number(dup.openingQuantity) || 0);

      await sequelize.query(
        `UPDATE stock_items
         SET quantity = :quantity,
             "defaultPrice" = :price,
             "openingQuantity" = :opening,
             "updatedAt" = NOW()
         WHERE id = :id`,
        {
          replacements: {
            quantity: keep.quantity,
            price: keep.defaultPrice,
            opening: keep.openingQuantity,
            id: keep.id,
          },
        },
      );
      await sequelize.query(
        `UPDATE stock_histories SET "stockItemId" = :keep WHERE "stockItemId" = :dup`,
        { replacements: { keep: keep.id, dup: dup.id } },
      );
      await sequelize.query(
        `UPDATE purchase_items SET "stockItemId" = :keep WHERE "stockItemId" = :dup`,
        { replacements: { keep: keep.id, dup: dup.id } },
      );

      const [recipes] = await sequelize.query(
        `SELECT id, "productId", quantity FROM product_recipes WHERE "stockItemId" = :dup`,
        { replacements: { dup: dup.id } },
      );
      for (const recipe of recipes) {
        const [clash] = await sequelize.query(
          `SELECT id FROM product_recipes WHERE "stockItemId" = :keep AND "productId" = :productId`,
          { replacements: { keep: keep.id, productId: recipe.productId } },
        );
        if (clash.length) {
          await sequelize.query(
            `UPDATE product_recipes SET quantity = quantity + :qty WHERE id = :id`,
            { replacements: { qty: recipe.quantity, id: clash[0].id } },
          );
          await sequelize.query(`DELETE FROM product_recipes WHERE id = :id`, {
            replacements: { id: recipe.id },
          });
        } else {
          await sequelize.query(
            `UPDATE product_recipes SET "stockItemId" = :keep WHERE id = :id`,
            { replacements: { keep: keep.id, id: recipe.id } },
          );
        }
      }

      await sequelize.query(
        `DELETE FROM stock_item_units WHERE "stockItemId" = :dup`,
        { replacements: { dup: dup.id } },
      );

      const [balances] = await sequelize.query(
        `SELECT id, "supplierId", quantity FROM stock_supplier_balances WHERE "stockItemId" = :dup`,
        { replacements: { dup: dup.id } },
      );
      for (const balance of balances) {
        const supplierSql =
          balance.supplierId == null
            ? `"supplierId" IS NULL`
            : `"supplierId" = ${Number(balance.supplierId)}`;
        const [existing] = await sequelize.query(
          `SELECT id FROM stock_supplier_balances WHERE "stockItemId" = :keep AND ${supplierSql}`,
          { replacements: { keep: keep.id } },
        );
        if (existing.length) {
          await sequelize.query(
            `UPDATE stock_supplier_balances
             SET quantity = quantity + :qty, "updatedAt" = NOW()
             WHERE id = :id`,
            { replacements: { qty: balance.quantity, id: existing[0].id } },
          );
          await sequelize.query(
            `DELETE FROM stock_supplier_balances WHERE id = :id`,
            { replacements: { id: balance.id } },
          );
        } else {
          await sequelize.query(
            `UPDATE stock_supplier_balances SET "stockItemId" = :keep WHERE id = :id`,
            { replacements: { keep: keep.id, id: balance.id } },
          );
        }
      }

      await sequelize.query(`DELETE FROM stock_items WHERE id = :id`, {
        replacements: { id: dup.id },
      });
    }
  }
}
