"use strict";

/** Add platformRole for platform panel RBAC (not cafe POS roles). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("platform_users", "platformRole", {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: "owner",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("platform_users", "platformRole");
  },
};
