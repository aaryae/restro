"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("departments", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      AvgPreparationTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: { min: 0 },
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: { min: 0 },
      },
      color: {
        type: Sequelize.STRING(7),
        allowNull: true,
        validate: {
          is: /^#[0-9A-F]{6}$/i,
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
          "CURRENT_TIMESTAMP",
        ),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("departments");
  },
};
