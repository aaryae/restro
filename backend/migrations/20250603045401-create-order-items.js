"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "order_items",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        orderId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "orders",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        productId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "products",
            key: "id",
          },
          onDelete: "SET NULL",
        },
        openItemId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "open_items",
            key: "id",
          },
          onDelete: "SET NULL",
        },
        departmentId: {
          type: Sequelize.INTEGER,
          allowNull: true, // Set to true to resolve foreign key conflict
          references: {
            model: "departments",
            key: "id",
          },
          onDelete: "SET NULL",
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        price: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          validate: { min: 0 },
        },
        subtotal: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.0,
        },
        discount: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          defaultValue: 0.0,
        },
        specialInstructions: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM(
            "pending",
            "preparing",
            "ready",
            "served",
            "cancelled",
          ),
          defaultValue: "pending",
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
            "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
          ),
        },
      },
      {
        indexes: [
          {
            fields: ["orderId", "productId"],
            name: "order_items_orderId_productId_idx",
          },
          {
            fields: ["orderId", "openItemId"],
            name: "order_items_orderId_openItemId_idx",
          },
        ],
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("order_items");
  },
};
