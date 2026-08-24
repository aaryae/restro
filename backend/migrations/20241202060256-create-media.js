"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("media", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      path: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      caption: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sizeInBytes: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      mimeType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      height: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      width: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      mediaCategoryId: {
        type: Sequelize.INTEGER,
        references: {
          model: "media_categories",
          key: "id",
        },
      },
      createdBy: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
      },
      updatedBy: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
      },

      isDeleted: {
        type: Sequelize.STRING,
        defaultValue: false,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("media");
  },
};
