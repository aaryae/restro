"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "expenses",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        cash_or_credit: {
          type: Sequelize.ENUM("cash", "credit"),
          defaultValue: "cash",
          allowNull: false,
        },
        paymentMethod: {
          type: Sequelize.ENUM("cash", "card", "online"),
          defaultValue: "cash",
          allowNull: false,
        },
        amount: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.0,
        },
        remarks: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        categoryId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "expense_categories", key: "id" },
          onDelete: "SET NULL",
          onUpdate: "CASCADE",
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
        accountId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "accounts", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
        paymentAccountId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "accounts", key: "id" },
          onDelete: "SET NULL",
          onUpdate: "CASCADE",
        },
        supplierId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "suppliers", key: "id" },
          onDelete: "SET NULL",
          onUpdate: "CASCADE",
        },
        paymentDate: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      },
      {
        indexes: [
          { fields: ["accountId"] },
          { fields: ["categoryId"] },
          { fields: ["supplierId"] },
        ],
      },
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("expenses");
  },
};
