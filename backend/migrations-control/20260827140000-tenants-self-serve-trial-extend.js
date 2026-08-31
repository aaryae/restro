"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      { tableName: "tenants", schema: "public" },
      "selfServeTrialExtendedAt",
      {
        type: Sequelize.DATE,
        allowNull: true,
        comment:
          "Set when the cafe used the one-time +3 day self-serve trial extension from POS",
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      { tableName: "tenants", schema: "public" },
      "selfServeTrialExtendedAt",
    );
  },
};
