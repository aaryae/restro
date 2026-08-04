"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("banner_items", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      bannerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "banners",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      image: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      caption: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      captionCSS: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      titleCSS: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      subTitle: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      subTitleCSS: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      primaryButton: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      primaryButtonUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      secondaryButton: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      secondaryButtonUrl: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable("banner_items");
  },
};
