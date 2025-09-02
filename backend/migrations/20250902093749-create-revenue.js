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
      accountId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "accounts",
          key: "id",
        },
        onDelete: "CASCADE",
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
      cash_or_credit: {
        type: Sequelize.ENUM("cash", "credit"),
        allowNull: false,
        defaultValue: "cash",
      },
      paymentMethod: {
        type: Sequelize.ENUM("cash", "card", "online"),
        allowNull: false,
        defaultValue: "cash",
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex("revenues", ["accountId"]);
    await queryInterface.addIndex("revenues", ["customerId"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("revenues");
  },
};
