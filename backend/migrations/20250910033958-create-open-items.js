"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "open_items",
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          allowNull: false,
          primaryKey: true,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        slug: {
          // Added to match slugGenerator in service
          type: Sequelize.STRING,
          allowNull: false,
        },
        alias: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        price: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
        },
        stockStatus: {
          type: Sequelize.ENUM("in_stock", "out_of_stock", "low_stock"),
          defaultValue: "in_stock",
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      },
      {
        indexes: [
          { fields: ["name"], name: "open_items_name_idx" },
          { fields: ["slug"], unique: true, name: "open_items_slug_unique" },
        ],
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("open_items");
  },
};
