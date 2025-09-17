"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "kots",
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
        departmentId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "departments",
            key: "id",
          },
          onDelete: "RESTRICT",
        },
        kotNumber: {
          type: Sequelize.INTEGER,
          unique: true,
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM("pending", "preparing", "ready", "cancelled"),
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
          { fields: ["orderId"], name: "kots_orderId_idx" },
          { fields: ["departmentId"], name: "kots_departmentId_idx" },
          {
            fields: ["kotNumber"],
            unique: true,
            name: "kots_kotNumber_unique",
          },
        ],
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("kots");
  },
};
