"use strict";

/** Staff accounts log in with username; email is optional. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "email", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "email", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
  