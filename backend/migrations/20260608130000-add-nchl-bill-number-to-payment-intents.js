"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("payment_intents", "nchlBillNumber", {
      type: Sequelize.STRING(64),
      allowNull: true,
      after: "merchantTxnRef",
    });
    await queryInterface.addIndex("payment_intents", ["nchlBillNumber"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("payment_intents", ["nchlBillNumber"]);
    await queryInterface.removeColumn("payment_intents", "nchlBillNumber");
  },
};
