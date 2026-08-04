"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("roles", [
      {
        title: "Super Admin",
        roleType: "developer",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Admin",
        roleType: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("roles", null, {});
  },
};
