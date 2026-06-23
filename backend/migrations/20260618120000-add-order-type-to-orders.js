"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("orders");

    if (!table.orderType) {
      await queryInterface.addColumn("orders", "orderType", {
        type: Sequelize.ENUM("dineIn", "takeaway"),
        allowNull: false,
        defaultValue: "dineIn",
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("orders");

    if (table.orderType) {
      await queryInterface.removeColumn("orders", "orderType");
    }
  },
};
