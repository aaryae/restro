"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("orders", "paymentStatus", {
      type: Sequelize.ENUM("pending", "paid", "failed", "partially_paid"),
      allowNull: true,
      defaultValue: "pending",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("orders", "paymentStatus", {
      type: Sequelize.ENUM("pending", "paid", "failed"),
      allowNull: true,
      defaultValue: "pending",
    });
  },
};
