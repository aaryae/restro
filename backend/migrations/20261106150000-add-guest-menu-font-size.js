"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("settings");
    if (!table.guestMenuFontSize) {
      await queryInterface.addColumn("settings", "guestMenuFontSize", {
        type: Sequelize.STRING(8),
        allowNull: true,
        defaultValue: "md",
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("settings");
    if (table.guestMenuFontSize) {
      await queryInterface.removeColumn("settings", "guestMenuFontSize");
    }
  },
};
