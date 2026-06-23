"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("payment_intents");

    if (!table.validationTraceId) {
      await queryInterface.addColumn("payment_intents", "validationTraceId", {
        type: Sequelize.STRING(64),
        allowNull: true,
      });
      await queryInterface.addIndex("payment_intents", ["validationTraceId"]);
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("payment_intents");

    if (table.validationTraceId) {
      await queryInterface.removeColumn("payment_intents", "validationTraceId");
    }
  },
};
