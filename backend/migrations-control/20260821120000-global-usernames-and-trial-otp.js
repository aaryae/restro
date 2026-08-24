"use strict";

/**
 * Platform-wide unique usernames + Serve email OTP fields on trial_users.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("global_usernames", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      username: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      source: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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

    await queryInterface.addColumn("trial_users", "emailVerified", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("trial_users", "otpSecret", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("trial_users", "otpExpiresAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Existing Google / password accounts are treated as already verified.
    await queryInterface.sequelize.query(
      `UPDATE trial_users SET "emailVerified" = true`,
    );

    const now = new Date();
    const [trialRows] = await queryInterface.sequelize.query(
      `SELECT username FROM trial_users WHERE username IS NOT NULL`,
    );
    for (const row of trialRows) {
      const username = String(row.username || "")
        .trim()
        .toLowerCase();
      if (!username) continue;
      await queryInterface.sequelize.query(
        `INSERT INTO global_usernames (username, source, "tenantId", "createdAt", "updatedAt")
         VALUES (:username, 'trial', NULL, :now, :now)
         ON CONFLICT (username) DO NOTHING`,
        { replacements: { username, now } },
      );
    }

    const [platformRows] = await queryInterface.sequelize.query(
      `SELECT username FROM platform_users WHERE username IS NOT NULL`,
    );
    for (const row of platformRows) {
      const username = String(row.username || "")
        .trim()
        .toLowerCase();
      if (!username) continue;
      await queryInterface.sequelize.query(
        `INSERT INTO global_usernames (username, source, "tenantId", "createdAt", "updatedAt")
         VALUES (:username, 'platform', NULL, :now, :now)
         ON CONFLICT (username) DO NOTHING`,
        { replacements: { username, now } },
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("trial_users", "otpExpiresAt");
    await queryInterface.removeColumn("trial_users", "otpSecret");
    await queryInterface.removeColumn("trial_users", "emailVerified");
    await queryInterface.dropTable("global_usernames");
  },
};
