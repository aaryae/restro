"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_stock_histories_type" ADD VALUE IF NOT EXISTS 'sale'`,
    );
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_stock_histories_type" ADD VALUE IF NOT EXISTS 'sale_reversal'`,
    );
    await queryInterface.addIndex(
      "stock_histories",
      ["referenceType", "referenceId"],
      { name: "stock_histories_reference_idx" },
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "stock_histories",
      "stock_histories_reference_idx",
    );
  },
};
