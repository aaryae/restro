"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("stock_items", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: true, unique: true },
      measuringUnitId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "measuring_units", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      stockGroupId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "stock_groups", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      supplierId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "suppliers", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      defaultPrice: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      openingQuantity: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      quantity: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      lowStockThreshold: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("stock_items");
  },
};
