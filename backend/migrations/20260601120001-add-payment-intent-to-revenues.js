"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("revenues", "paymentIntentId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "payment_intents", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("revenues", "gatewayReference", {
      type: Sequelize.STRING(128),
      allowNull: true,
    });
    await queryInterface.addIndex("revenues", ["paymentIntentId"]);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("revenues", "gatewayReference");
    await queryInterface.removeColumn("revenues", "paymentIntentId");
  },
};
