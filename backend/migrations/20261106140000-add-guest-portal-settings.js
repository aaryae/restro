"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("settings");
    if (!table.guestWelcome) {
      await queryInterface.addColumn("settings", "guestWelcome", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    if (!table.guestHours) {
      await queryInterface.addColumn("settings", "guestHours", {
        type: Sequelize.STRING(180),
        allowNull: true,
      });
    }
    if (!table.guestInfoNote) {
      await queryInterface.addColumn("settings", "guestInfoNote", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("settings");
    if (table.guestInfoNote) {
      await queryInterface.removeColumn("settings", "guestInfoNote");
    }
    if (table.guestHours) {
      await queryInterface.removeColumn("settings", "guestHours");
    }
    if (table.guestWelcome) {
      await queryInterface.removeColumn("settings", "guestWelcome");
    }
  },
};
