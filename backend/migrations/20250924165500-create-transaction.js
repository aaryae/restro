"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("transactions", {
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
        comment: "The account for the transaction",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "RESTRICT",
        comment: "The user who performed the transaction",
      },
      type: {
        type: Sequelize.ENUM("deposit", "withdraw"),
        allowNull: false,
        comment: "Transaction type: deposit or withdraw",
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: "Transaction amount",
      },
      transactionDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: "Date and time of transaction",
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Additional notes or reason for transaction",
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
    await queryInterface.addIndex("transactions", ["accountId"], {
      name: "transactions_accountId_index",
    });
    await queryInterface.addIndex("transactions", ["userId"], {
      name: "transactions_userId_index",
    });
    await queryInterface.addIndex("transactions", ["type"], {
      name: "transactions_type_index",
    });
    await queryInterface.addIndex("transactions", ["transactionDate"], {
      name: "transactions_transactionDate_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("transactions");
  },
};
