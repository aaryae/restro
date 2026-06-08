"use strict";

/** Bank qrImage base64 data URLs exceed VARCHAR(512). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("payment_intents", "qrImageUrl", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("payment_intents", "qrImageUrl", {
      type: Sequelize.STRING(512),
      allowNull: true,
    });
  },
};
