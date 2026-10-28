"use strict";

/**
 * Soft sync: same-name rows stay in the database so sync can be undone.
 * mergedIntoId marks a row that was folded into an older stock item.
 * syncPayload stores the pre-merge quantities needed to undo.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("stock_items", "mergedIntoId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "stock_items", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("stock_items", "syncPayload", {
      type: Sequelize.JSON,
      allowNull: true,
    });
    await queryInterface.addIndex("stock_items", ["mergedIntoId"], {
      name: "stock_items_merged_into_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "stock_items",
      "stock_items_merged_into_idx",
    );
    await queryInterface.removeColumn("stock_items", "syncPayload");
    await queryInterface.removeColumn("stock_items", "mergedIntoId");
  },
};
