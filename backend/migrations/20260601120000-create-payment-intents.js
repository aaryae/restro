"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payment_intents", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "orders", key: "id" },
        onDelete: "CASCADE",
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: "NPR",
      },
      merchantTxnRef: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      gatewayTxnId: {
        type: Sequelize.STRING(128),
        allowNull: true,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM(
          "pending",
          "paid",
          "failed",
          "expired",
          "cancelled",
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      qrPayload: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      qrImageUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      accountId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "accounts", key: "id" },
        onDelete: "SET NULL",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      attempt: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      rawInitiateResponse: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      rawConfirmPayload: {
        type: Sequelize.JSON,
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
    });

    await queryInterface.addIndex("payment_intents", ["orderId"]);
    await queryInterface.addIndex("payment_intents", ["status"]);
    await queryInterface.addIndex("payment_intents", ["expiresAt"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("payment_intents");
  },
};
