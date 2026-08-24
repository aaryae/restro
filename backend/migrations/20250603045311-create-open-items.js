"use strict";

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
        departmentId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "departments",
            key: "id",
          },
          onDelete: "RESTRICT",
        },
        stockStatus: {
          type: Sequelize.ENUM("in_stock", "out_of_stock", "low_stock"),
          defaultValue: "in_stock",
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal(
            "CURRENT_TIMESTAMP",
          ),
        },
      },
      {
        indexes: [
          { fields: ["name"], name: "open_items_name_idx" },
          { fields: ["departmentId"], name: "open_items_departmentId_idx" },
        ],
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("open_items");
  },
};
