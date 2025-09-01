"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("revenues", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      cash_or_credit: {
        type: Sequelize.ENUM("cash", "credit"),
        defaultValue: "cash",
      },
      paymentMethod: {
        type: Sequelize.ENUM("cash", "card", "online"),
        defaultValue: "cash",
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "customers",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
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

    await queryInterface.addIndex("revenues", ["customerId"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("revenues");
  },
};
