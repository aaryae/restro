"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("products", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      productCategoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "product_categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "departments",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
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
        validate: { min: 1 },
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        validate: { min: 0 },
      },
      stockStatus: {
        type: Sequelize.ENUM("in_stock", "out_of_stock", "low_stock"),
        defaultValue: "in_stock",
      },
      reservedQuantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      hasVariant: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("products");
  },
};
