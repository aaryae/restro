const { sequelize, Sequelize } = require("../../models");

const withTransaction = async (fn) => {
  try {
    return await sequelize.transaction(
      {
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
      },
      fn,
    );
  } catch (e) {
    console.error("Transaction error:", e);
    return {
      status: 500,
      success: false,
      msg: "Internal server error",
      error: e.message,
    };
  }
};

module.exports = { withTransaction };
