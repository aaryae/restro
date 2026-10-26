"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("stock_item_units", {
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
      measuringUnitId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "measuring_units", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      ofUnitId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "measuring_units", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      factor: {
        type: Sequelize.DECIMAL(14, 4),
        allowNull: false,
      },
      factorToBase: {
        type: Sequelize.DECIMAL(14, 4),
        allowNull: false,
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex(
      "stock_item_units",
      ["stockItemId", "measuringUnitId"],
      { unique: true, name: "stock_item_units_item_unit_unique" },
    );
    await queryInterface.addIndex(
      "stock_item_units",
      ["stockItemId", "level"],
      { unique: true, name: "stock_item_units_item_level_unique" },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("stock_item_units");
  },
};
