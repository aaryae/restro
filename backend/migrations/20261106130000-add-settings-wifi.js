"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("settings");
    if (!table.wifiSsid) {
      await queryInterface.addColumn("settings", "wifiSsid", {
        type: Sequelize.STRING(64),
        allowNull: true,
      });
    }
    if (!table.wifiPassword) {
      await queryInterface.addColumn("settings", "wifiPassword", {
        type: Sequelize.STRING(128),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("settings");
    if (table.wifiPassword) {
      await queryInterface.removeColumn("settings", "wifiPassword");
    }
    if (table.wifiSsid) {
      await queryInterface.removeColumn("settings", "wifiSsid");
    }
  },
};
