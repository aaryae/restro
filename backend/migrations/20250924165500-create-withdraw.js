"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("withdraws", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      accountId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "accounts",
          key: "id",
        },
        onDelete: "RESTRICT",
        comment: "The account from which withdrawal is made",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "RESTRICT",
        comment: "The user who performed the withdrawal",
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: "Withdrawal amount",
      },
      withdrawalDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: "Date and time of withdrawal",
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Additional notes or reason for withdrawal",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Add indexes
    await queryInterface.addIndex("withdraws", ["accountId"], {
      name: "withdraws_accountId_index",
    });
    await queryInterface.addIndex("withdraws", ["userId"], {
      name: "withdraws_userId_index",
    });
    await queryInterface.addIndex("withdraws", ["withdrawalDate"], {
      name: "withdraws_withdrawalDate_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("withdraws");
  },
};
