"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      { tableName: "tenants", schema: "public" },
      "statusBeforeSuspend",
      {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      { tableName: "tenants", schema: "public" },
      "statusBeforeSuspend",
    );
  },
};
