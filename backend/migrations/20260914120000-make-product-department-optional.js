"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const products = await queryInterface.describeTable("products");
    if (products.departmentId && products.departmentId.allowNull === false) {
      await queryInterface.changeColumn("products", "departmentId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "departments",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }

    const orderItems = await queryInterface.describeTable("order_items");
    if (orderItems.departmentId && orderItems.departmentId.allowNull === false) {
      await queryInterface.changeColumn("order_items", "departmentId", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    const kots = await queryInterface.describeTable("kots");
    if (kots.departmentId && kots.departmentId.allowNull === false) {
      await queryInterface.changeColumn("kots", "departmentId", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverting to NOT NULL is unsafe if nulls already exist; leave nullable.
  },
};
