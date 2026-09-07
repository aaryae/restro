"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("purchase_items", "stockItemId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "stock_items", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("purchase_items", "stockItemId");
  },
};
