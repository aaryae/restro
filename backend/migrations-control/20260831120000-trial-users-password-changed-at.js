"use strict";

/** Used to reject Trial JWTs issued before a password reset. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("trial_users", "passwordChangedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("trial_users", "passwordChangedAt");
  },
};
