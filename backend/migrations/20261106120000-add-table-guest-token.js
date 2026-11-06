"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("tables");
    if (!table.guestToken) {
      await queryInterface.addColumn("tables", "guestToken", {
        type: Sequelize.STRING(64),
        allowNull: true,
        unique: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("tables");
    if (table.guestToken) {
      await queryInterface.removeColumn("tables", "guestToken");
    }
  },
};
