"use strict";

/** Per-operator checkbox permissions (JSONB array). Owners ignore this and get all. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("platform_users", "permissions", {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("platform_users", "permissions");
  },
};
