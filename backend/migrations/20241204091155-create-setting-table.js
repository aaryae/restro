"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("settings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      brand_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      primary_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      secondary_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fav_icon: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      mapUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      brandingImage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      brandingFooterImage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      footer_desc: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      google_analytics: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      primaryColor: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      openingBalance: {
        type: Sequelize.DECIMAL,
        allowNull: true,
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
    await queryInterface.dropTable("settings");
  },
};
