"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("accounts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      accountType: {
        type: Sequelize.ENUM("cash", "bank", "wallet"),
        allowNull: false,
        defaultValue: "cash",
      },
      openingBalance: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      currentBalance: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      description: {
        type: Sequelize.TEXT,
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

    // Add index
    await queryInterface.addIndex("accounts", ["accountType"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("accounts");
  },
};
