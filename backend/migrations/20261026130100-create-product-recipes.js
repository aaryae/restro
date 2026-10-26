"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_recipes", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "products", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      stockItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "stock_items", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      measuringUnitId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "measuring_units", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      quantity: {
        type: Sequelize.DECIMAL(14, 4),
        allowNull: false,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex(
      "product_recipes",
      ["productId", "stockItemId"],
      { unique: true, name: "product_recipes_product_stock_unique" },
    );
    await queryInterface.addIndex("product_recipes", ["stockItemId"], {
      name: "product_recipes_stock_item_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("product_recipes");
  },
};
