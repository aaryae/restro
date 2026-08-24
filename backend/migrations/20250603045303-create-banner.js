"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("banners", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      responsiveSettings: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sliderSettings: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      video_url: {
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
    await queryInterface.addIndex("banners", ["slug"], {
      unique: true,
      name: "banner_slug_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("banners", "banner_slug_index");
    await queryInterface.dropTable("banners");
  },
};
