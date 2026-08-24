"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payment_integrations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "nepalpay",
      },
      accountId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "accounts", key: "id" },
        onDelete: "SET NULL",
      },

      merchantId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      merchantCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      merchantCategoryCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      merchantName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      acquirerId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      merchantCity: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      merchantPostalCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      npiUsername: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      // Encrypted at rest (AES-256-GCM); never stored or returned in plaintext.
      passwordEnc: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      webhookTokenEnc: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      npiPrivateKeyEnc: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex("payment_integrations", ["provider"]);
    await queryInterface.addIndex("payment_integrations", ["isActive"]);
    await queryInterface.addIndex("payment_integrations", ["accountId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("payment_integrations");
  },
};
