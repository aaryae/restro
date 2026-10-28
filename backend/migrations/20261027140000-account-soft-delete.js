"use strict";

/**
 * Soft-delete accounts so cash/bank rows with transfer/expense history
 * can be removed from the UI after the balance is transferred out,
 * without breaking RESTRICT foreign keys on transfers.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("accounts", "deletedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addIndex("accounts", ["deletedAt"], {
      name: "accounts_deleted_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("accounts", "accounts_deleted_at_idx");
    await queryInterface.removeColumn("accounts", "deletedAt");
  },
};
