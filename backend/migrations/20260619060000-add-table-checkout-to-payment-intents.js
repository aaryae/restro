"use strict";

/**
 * Adds table-level "checkout all" support to payment intents so a single
 * NEPALPAY dynamic QR can settle every active order on a table at once.
 * `orderId` stays the anchor (first) order; `tableId`/`sessionId`/`checkoutAll`
 * tell settlement to complete all active orders on that session.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("payment_intents");

    if (!table.tableId) {
      await queryInterface.addColumn("payment_intents", "tableId", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!table.sessionId) {
      await queryInterface.addColumn("payment_intents", "sessionId", {
        type: Sequelize.STRING(64),
        allowNull: true,
      });
    }

    if (!table.checkoutAll) {
      await queryInterface.addColumn("payment_intents", "checkoutAll", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    await queryInterface
      .addIndex("payment_intents", ["tableId"])
      .catch(() => {});
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("payment_intents");

    await queryInterface
      .removeIndex("payment_intents", ["tableId"])
      .catch(() => {});

    if (table.checkoutAll) {
      await queryInterface.removeColumn("payment_intents", "checkoutAll");
    }
    if (table.sessionId) {
      await queryInterface.removeColumn("payment_intents", "sessionId");
    }
    if (table.tableId) {
      await queryInterface.removeColumn("payment_intents", "tableId");
    }
  },
};
