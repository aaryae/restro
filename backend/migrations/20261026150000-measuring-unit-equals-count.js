"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("measuring_units", "equalsCount", {
      type: Sequelize.DECIMAL(14, 4),
      allowNull: true,
    });
    await queryInterface.sequelize.query(
      `UPDATE measuring_units
       SET "equalsCount" = 1
       WHERE "equalsFactor" IS NOT NULL AND "equalsCount" IS NULL`,
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("measuring_units", "equalsCount");
  },
};
