"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("revenues");

    if (!table.orderId) {
      await queryInterface.addColumn("revenues", "orderId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "orders",
          key: "id",
        },
        onDelete: "CASCADE",
      });

      await queryInterface.addIndex("revenues", ["orderId"]);
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("revenues");

    if (table.orderId) {
      await queryInterface.removeIndex("revenues", ["orderId"]);
      await queryInterface.removeColumn("revenues", "orderId");
    }
  },
};
