"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("measuring_units", "equalsUnitId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "measuring_units", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await queryInterface.addColumn("measuring_units", "equalsFactor", {
      type: Sequelize.DECIMAL(14, 4),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("measuring_units", "equalsFactor");
    await queryInterface.removeColumn("measuring_units", "equalsUnitId");
  },
};
