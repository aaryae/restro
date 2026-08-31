"use strict";

/** Profile photo for platform operators (superadmin). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("platform_users", "imageUrl", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("platform_users", "imageUrl");
  },
};
