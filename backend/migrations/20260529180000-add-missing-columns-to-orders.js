"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("orders");

    if (!table.paymentMethods) {
      await queryInterface.addColumn("orders", "paymentMethods", {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }

    if (!table.payableAmount) {
      await queryInterface.addColumn("orders", "payableAmount", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      });
    }

    if (!table.takeAwayName) {
      await queryInterface.addColumn("orders", "takeAwayName", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.sessionId) {
      await queryInterface.addColumn("orders", "sessionId", {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }

    if (!table.orderStartTime) {
      await queryInterface.addColumn("orders", "orderStartTime", {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      });
    }

    if (!table.orderFinishTime) {
      await queryInterface.addColumn("orders", "orderFinishTime", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!table.isGuestOrder) {
      await queryInterface.addColumn("orders", "isGuestOrder", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("orders");
    const columns = [
      "paymentMethods",
      "payableAmount",
      "takeAwayName",
      "sessionId",
      "orderStartTime",
      "orderFinishTime",
      "isGuestOrder",
    ];

    for (const column of columns) {
      if (table[column]) {
        await queryInterface.removeColumn("orders", column);
      }
    }
  },
};
