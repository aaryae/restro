"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("socials", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      social_title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      social_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      fav_icon: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      settingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "settings",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("socials");
  },
};
