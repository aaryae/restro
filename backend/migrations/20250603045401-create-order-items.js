"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("order_items", {
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
        allowNull: true, // Changed from false to true to allow null for addons
        references: {
          model: "departments",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      // New fields for addons
      parentOrderItemId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "order_items",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      addonId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "addons",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      isAddon: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      kotId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "kots",
          key: "id",
        },
        onDelete: "RESTRICT",
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
          "completed",
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
    });

    // Add indexes
    await queryInterface.addIndex("order_items", ["orderId", "productId"], {
      name: "order_items_orderId_productId_idx",
    });
    await queryInterface.addIndex("order_items", ["orderId", "openItemId"], {
      name: "order_items_orderId_openItemId_idx",
    });
    await queryInterface.addIndex("order_items", ["kotId"]);
    await queryInterface.addIndex("order_items", ["parentOrderItemId"]);
    await queryInterface.addIndex("order_items", ["addonId"]);
    await queryInterface.addIndex("order_items", ["isAddon"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("order_items");
  },
};
