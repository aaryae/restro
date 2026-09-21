"use strict";

/** Store selected line IDs for partial NepalPay QR settlement. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("payment_intents", "orderItemIds", {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("payment_intents", "orderItemIds");
  },
};
