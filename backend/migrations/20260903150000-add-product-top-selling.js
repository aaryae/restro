"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("products");
    if (!table.isTopSelling) {
      await queryInterface.addColumn("products", "isTopSelling", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
    if (!table.topSellingOrder) {
      await queryInterface.addColumn("products", "topSellingOrder", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("products");
    if (table.topSellingOrder) {
      await queryInterface.removeColumn("products", "topSellingOrder");
    }
    if (table.isTopSelling) {
      await queryInterface.removeColumn("products", "isTopSelling");
    }
  },
};
