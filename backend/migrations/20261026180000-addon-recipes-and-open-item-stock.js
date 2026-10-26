"use strict";

/**
 * Addons use the same ingredient rows as menu items.
 * An open item can point at one stock item and a base-unit amount per sale.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("addon_recipes", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      addonId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "addons", key: "id" },
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

    await queryInterface.addIndex("addon_recipes", ["addonId", "stockItemId"], {
      unique: true,
      name: "addon_recipes_addon_stock_unique",
    });

    await queryInterface.addColumn("open_items", "stockItemId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "stock_items", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("open_items", "stockQuantity", {
      type: Sequelize.DECIMAL(14, 4),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("open_items", "stockQuantity");
    await queryInterface.removeColumn("open_items", "stockItemId");
    await queryInterface.dropTable("addon_recipes");
  },
};
