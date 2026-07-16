const { Op } = require("sequelize");
const { startOfDay, endOfDay, parseISO } = require("date-fns");

const {
  transactionModel,
  accountModel,
  userModel,
  sequelize,
} = require("../../models");

const paginate = require("../../utils/paginate");

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { accountId, amount, remarks, type } = req.body;
    const { id: userId } = req.user;

    // Validate transaction type
    if (!type || !["deposit", "withdraw"].includes(type)) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Transaction type must be either 'deposit' or 'withdraw'",
      };
    }

    // Verify account exists and is active
    const account = await accountModel.findByPk(accountId, { transaction });
    if (!account) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: "Account not found",
      };
    }

    if (account.status !== "active") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Cannot perform transaction on inactive account",
      };
    }

    // Check balance for withdrawals
    if (type === "withdraw") {
      const currentBalance = Number(account.currentBalance) || 0;
      if (currentBalance < amount) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Insufficient account balance for withdrawal",
        };
      }
    }

    // Create transaction record
    const transactionRecord = await transactionModel.create(
      {
        accountId,
        userId,
        type,
        amount,
        remarks,
      },
      { transaction },
    );

    // Update account balance
    const currentBalance = Number(account.currentBalance) || 0;
    const newBalance = type === "deposit"
      ? currentBalance + amount
      : currentBalance - amount;

    await account.update(
      {
        currentBalance: newBalance,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      status: 201,
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully`,
      data: {
        transaction: transactionRecord,
        account: {
          id: account.id,
          name: account.name,
          previousBalance: currentBalance,
          newBalance,
          accountType: account.accountType,
        },
      },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const list = async (req) => {
  try {
    let {
      limit,
      page,
      accountId,
      userId,
      type,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      name,
      userName,
    } = req.query;

    const filters = {};
    const include = [
      {
        model: accountModel,
        as: "account",
        attributes: ["id", "name", "accountType", "currentBalance"],
      },
      {
        model: userModel,
        as: "user",
        attributes: ["id", "firstName", "lastName", "email", "username"],
      },
    ];

    if (name) {
      include[0].required = true;
      include[0].where = {
        ...(include[0].where || {}),
        name: { [Op.like]: `%${name}%` },
      };
    }
    if (userName) {
      include[1].required = true;
      include[1].where = {
        ...(include[1].where || {}),
        username: { [Op.like]: `%${userName}%` },
      };
    }

    if (accountId) filters.accountId = accountId;
    if (userId) filters.userId = userId;
    if (type) filters.type = type;
    if (minAmount) filters.amount = { [Op.gte]: minAmount };
    if (maxAmount) filters.amount = { ...filters.amount, [Op.lte]: maxAmount };

    const result = await paginate(transactionModel, {
      limit,
      page,
      filters,
      include,
      order: [["transactionDate", "DESC"]],
    });

    if (!result) {
      return {
        status: 500,
        success: false,
        message: "Transaction list failed",
      };
    }

    return {
      status: 200,
      success: true,
      message: "Transactions retrieved successfully",
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const { id } = req.params;

    const transaction = await transactionModel.findByPk(id, {
      include: [
        {
          model: accountModel,
          as: "account",
          attributes: ["id", "name", "accountType", "currentBalance"],
        },
        {
          model: userModel,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });

    if (!transaction) {
      return {
        status: 404,
        success: false,
        message: "Transaction not found",
      };
    }

    return {
      status: 200,
      success: true,
      message: "Transaction retrieved successfully",
      data: transaction,
    };
  } catch (error) {
    throw error;
  }
};

// Calculate total transaction amounts with optional filters
const total = async (req) => {
  try {
    let { accountId, userId, startDate, endDate, minAmount, maxAmount } =
      req.query;

    const filters = {};

    if (accountId) filters.accountId = accountId;
    if (userId) filters.userId = userId;
    if (minAmount) filters.amount = { [Op.gte]: minAmount };
    if (maxAmount)
      filters.amount = { ...filters.amount, [Op.lte]: maxAmount };

    if (startDate && endDate) {
      const start = startOfDay(parseISO(startDate));
      const end = endOfDay(parseISO(endDate));
      filters.transactionDate = { [Op.between]: [start, end] };
    } else if (startDate) {
      const start = startOfDay(parseISO(startDate));
      filters.transactionDate = { [Op.gte]: start };
    } else if (endDate) {
      const end = endOfDay(parseISO(endDate));
      filters.transactionDate = { [Op.lte]: end };
    }

    // Get total deposits
    const depositResult = await transactionModel.findAll({
      where: { ...filters, type: "deposit" },
      attributes: [[sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("amount")), 0), "totalDeposit" ]],
      raw: true,
    });

    // Get total withdrawals
    const withdrawResult = await transactionModel.findAll({
      where: { ...filters, type: "withdraw" },
      attributes: [[sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("amount")), 0), "totalWithdraw" ]],
      raw: true,
    });

    const totalDeposit = Number(depositResult?.[0]?.totalDeposit || 0);
    const totalWithdraw = Number(withdrawResult?.[0]?.totalWithdraw || 0);

    return {
      status: 200,
      success: true,
      message: "Total transaction amounts calculated successfully",
      data: {
        totalDeposit,
        totalWithdraw,
        netTotal: totalDeposit - totalWithdraw
      },
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  list,
  getById,
  total,
};
