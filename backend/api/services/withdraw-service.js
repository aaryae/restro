const { Op } = require("sequelize");
const { startOfDay, endOfDay, parseISO } = require("date-fns");

const {
  withdrawModel,
  accountModel,
  userModel,
  sequelize,
} = require("../../models");

const paginate = require("../../utils/paginate");

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { accountId, amount, remarks } = req.body;
    const { id: userId } = req.user;

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
        message: "Cannot withdraw from inactive account",
      };
    }

    // Check if sufficient balance
    const currentBalance = Number(account.currentBalance) || 0;
    if (currentBalance < amount) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Insufficient account balance for withdrawal",
      };
    }

    // Create withdrawal record
    const withdrawal = await withdrawModel.create(
      {
        accountId,
        userId,
        amount,
        remarks,
      },
      { transaction },
    );

    // Update account balance
    const newBalance = currentBalance - amount;
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
      message: "Withdrawal created successfully",
      data: {
        withdrawal,
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
      startDate,
      endDate,
      minAmount,
      maxAmount,
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

    // Apply filters
    if (accountId) filters.accountId = accountId;
    if (userId) filters.userId = userId;
    if (minAmount) filters.amount = { [Op.gte]: minAmount };
    if (maxAmount) filters.amount = { ...filters.amount, [Op.lte]: maxAmount };

    // Date range filtering
    if (startDate && endDate) {
      const start = startOfDay(parseISO(startDate));
      const end = endOfDay(parseISO(endDate));
      filters.withdrawalDate = { [Op.between]: [start, end] };
    } else if (startDate) {
      const start = startOfDay(parseISO(startDate));
      filters.withdrawalDate = { [Op.gte]: start };
    } else if (endDate) {
      const end = endOfDay(parseISO(endDate));
      filters.withdrawalDate = { [Op.lte]: end };
    }

    const result = await paginate(withdrawModel, {
      limit,
      page,
      filters,
      include,
      order: [["withdrawalDate", "DESC"]],
    });

    if (!result) {
      return {
        status: 500,
        success: false,
        message: "Withdrawal list failed",
      };
    }

    return {
      status: 200,
      success: true,
      message: "Withdrawals retrieved successfully",
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const { id } = req.params;

    const withdrawal = await withdrawModel.findByPk(id, {
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

    if (!withdrawal) {
      return {
        status: 404,
        success: false,
        message: "Withdrawal not found",
      };
    }

    return {
      status: 200,
      success: true,
      message: "Withdrawal retrieved successfully",
      data: withdrawal,
    };
  } catch (error) {
    throw error;
  }
};

const update = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { amount, remarks } = req.body;

    const withdrawal = await withdrawModel.findByPk(id, {
      include: [
        {
          model: accountModel,
          as: "account",
        },
      ],
      transaction,
    });

    if (!withdrawal) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: "Withdrawal not found",
      };
    }

    // Check if withdrawal can be updated (not too old, etc.)
    const withdrawalDate = new Date(withdrawal.withdrawalDate);
    const now = new Date();
    const hoursDiff = (now - withdrawalDate) / (1000 * 60 * 60);

    // Allow updates within 24 hours
    if (hoursDiff > 24) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Cannot update withdrawal older than 24 hours",
      };
    }

    // Calculate balance adjustment
    const oldAmount = Number(withdrawal.amount);
    const newAmount = Number(amount);
    const difference = newAmount - oldAmount;

    if (difference !== 0) {
      const account = withdrawal.account;
      const currentBalance = Number(account.currentBalance);

      // Check if new amount would cause negative balance
      if (currentBalance + oldAmount - newAmount < 0) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Insufficient account balance for updated withdrawal amount",
        };
      }

      // Update account balance
      await account.update(
        {
          currentBalance: currentBalance + oldAmount - newAmount,
        },
        { transaction },
      );
    }

    // Update withdrawal record
    const updates = {};
    if (amount !== undefined) updates.amount = amount;
    if (remarks !== undefined) updates.remarks = remarks;

    await withdrawal.update(updates, { transaction });

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: "Withdrawal updated successfully",
      data: withdrawal,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  create,
  list,
  getById,
  update,
};

// Calculate total withdrawn amount with optional filters
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
      filters.withdrawalDate = { [Op.between]: [start, end] };
    } else if (startDate) {
      const start = startOfDay(parseISO(startDate));
      filters.withdrawalDate = { [Op.gte]: start };
    } else if (endDate) {
      const end = endOfDay(parseISO(endDate));
      filters.withdrawalDate = { [Op.lte]: end };
    }

    const result = await withdrawModel.findAll({
      where: filters,
      attributes: [[sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("amount")), 0), "totalAmount" ]],
      raw: true,
    });

    const totalAmount = Number(result?.[0]?.totalAmount || 0);

    return {
      status: 200,
      success: true,
      message: "Total withdraw amount calculated successfully",
      data: { totalAmount },
    };
  } catch (error) {
    throw error;
  }
};

module.exports.total = total;
