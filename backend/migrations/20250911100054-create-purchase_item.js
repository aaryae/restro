"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("purchase_items", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      purchaseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "purchases", key: "id" },
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "purchase_categories", key: "id" },
      },
      hsCode: { type: Sequelize.STRING, allowNull: true },
      particulars: { type: Sequelize.STRING, allowNull: false },
      quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      rate: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      isTaxable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("purchase_items");
  },
};
