"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("order_items");

    if (!table.parentOrderItemId) {
      await queryInterface.addColumn("order_items", "parentOrderItemId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "order_items",
          key: "id",
        },
        onDelete: "CASCADE",
      });
    }

    if (!table.addonId) {
      await queryInterface.addColumn("order_items", "addonId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "addons",
          key: "id",
        },
        onDelete: "SET NULL",
      });
    }

    if (!table.isAddon) {
      await queryInterface.addColumn("order_items", "isAddon", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("order_items");

    if (table.parentOrderItemId) {
      await queryInterface.removeColumn("order_items", "parentOrderItemId");
    }
    if (table.addonId) {
      await queryInterface.removeColumn("order_items", "addonId");
    }
    if (table.isAddon) {
      await queryInterface.removeColumn("order_items", "isAddon");
    }
  },
};
