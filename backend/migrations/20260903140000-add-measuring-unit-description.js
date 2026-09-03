"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("measuring_units");
    if (!table.description) {
      await queryInterface.addColumn("measuring_units", "description", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("measuring_units");
    if (table.description) {
      await queryInterface.removeColumn("measuring_units", "description");
    }
  },
};
