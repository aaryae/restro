"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("stock_histories", {
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
      type: {
        type: Sequelize.ENUM(
          "opening",
          "purchase",
          "adjustment_in",
          "adjustment_out",
          "waste",
        ),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      rate: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      note: { type: Sequelize.TEXT, allowNull: true },
      referenceType: { type: Sequelize.STRING, allowNull: true },
      referenceId: { type: Sequelize.INTEGER, allowNull: true },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("stock_histories");
  },
};
