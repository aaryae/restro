"use strict";

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable("orders");

    const renames = [
      ["saleNote", "orderNote"],
      ["saleDate", "orderStartTime"],
      ["saleCompletedAt", "orderFinishTime"],
      ["customerName", "takeAwayName"],
    ];

    for (const [from, to] of renames) {
      if (table[from] && !table[to]) {
        await queryInterface.renameColumn("orders", from, to);
        table[to] = table[from];
        delete table[from];
      }
    }

    if (table.saleType && table.orderType) {
      await queryInterface.sequelize.query(`
        UPDATE orders
        SET orderType = CASE
          WHEN saleType = 'pickup' THEN 'takeaway'
          ELSE 'dineIn'
        END
      `);
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("orders");

    const renames = [
      ["orderNote", "saleNote"],
      ["orderStartTime", "saleDate"],
      ["orderFinishTime", "saleCompletedAt"],
      ["takeAwayName", "customerName"],
    ];

    for (const [from, to] of renames) {
      if (table[from] && !table[to]) {
        await queryInterface.renameColumn("orders", from, to);
      }
    }
  },
};
