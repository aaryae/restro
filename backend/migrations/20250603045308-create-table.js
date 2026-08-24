"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tables", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      floorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "floors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      sessionId: {
        type: Sequelize.UUID,
        allowNull: true,
        unique:true
      },
      tableNo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM("indoor", "outdoor", "vip", "regular"),
        allowNull: false,
        defaultValue: "regular",
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 4,
        validate: { min: 1 },
      },
      status: {
        type: Sequelize.ENUM(
          "available",
          "occupied",
          "maintenance",
        ),
        allowNull: false,
        defaultValue: "available",
      },
      currentSessionId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      sessionStartTime: {
        type: Sequelize.DATE,
        allowNull: true,
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
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("tables");
  },
};
