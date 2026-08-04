"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("users", [
      {
        username: "superadmin",
        password:
          "$2a$12$1.D/FtJD8PnlH8NR2iPp9uIqCnN98h4lvN6JFXYiP30gMyTG/zjVK",
        firstName: "Super",
        lastName: "admin",
        email: "superadmin@technirvana.com.np",
        mobileNo: "9800000001",
        mobilePrefix: "+977",
        roleId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "admin",
        password:
          "$2a$12$1.D/FtJD8PnlH8NR2iPp9uIqCnN98h4lvN6JFXYiP30gMyTG/zjVK",
        firstName: "Admin",
        lastName: "User",
        email: "admin@technirvana.com.np",
        mobileNo: "9800000002",
        mobilePrefix: "+977",
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  },
};
