const {
  expenseModel,
  expenseCategoryModel,
  Account,
  sequelize,
} = require("../../models");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      cash_or_credit,
      paymentMethod,
      amount,
      remarks,
      categoryId,
      accountId,
    } = req.body;

    // Validate references
    const account = await Account.findByPk(accountId, { transaction });
    if (!account || account.status !== "active") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Invalid or inactive account",
        data: null,
      };
    }
    if (categoryId) {
      const category = await expenseCategoryModel.findByPk(categoryId, {
        transaction,
      });
      if (!category || !category.isActive) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Invalid or inactive category",
          data: null,
        };
      }
    }

    const expense = await expenseModel.create(
      {
        cash_or_credit,
        paymentMethod,
        amount,
        remarks,
        categoryId,
        userId: req.user.id,
        accountId,
      },
      { transaction },
    );

    const result = await expenseModel.findByPk(expense.id, {
      include: [
        { model: expenseCategoryModel, as: "category" },
        { model: Account, as: "account" },
      ],
      transaction,
    });

    await transaction.commit();
    return {
      ...generalConstant.EN.EXPENSE.CREATE_EXPENSE_SUCCESS,
      data: result,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const list = async (req) => {
  try {
    const { limit, page, categoryId, cash_or_credit } = req.query;
    const filters = {};
    if (categoryId) filters.categoryId = +categoryId;
    if (cash_or_credit) filters.cash_or_credit = cash_or_credit;
    const order = [["createdAt", "DESC"]];

    const result = await paginate(expenseModel, {
      limit,
      page,
      filters,
      order,
      include: [
        { model: expenseCategoryModel, as: "category" },
        { model: Account, as: "account" },
      ],
    });

    if (!result) {
      return { ...generalConstant.EN.EXPENSE.EXPENSE_LIST_FAILURE, data: null };
    }
    return { ...generalConstant.EN.EXPENSE.EXPENSE_LIST_SUCCESS, data: result };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const expense = await expenseModel.findByPk(+req.params.id, {
      include: [
        { model: expenseCategoryModel, as: "category" },
        { model: Account, as: "account" },
      ],
    });
    if (!expense) {
      return { ...generalConstant.EN.EXPENSE.EXPENSE_NOT_FOUND, data: null };
    }
    return { ...generalConstant.EN.EXPENSE.EXPENSE_GET_SUCCESS, data: expense };
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const expense = await expenseModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!expense) {
      await transaction.rollback();
      return { ...generalConstant.EN.EXPENSE.EXPENSE_NOT_FOUND, data: null };
    }
    if (expense.paymentDate || expense.cash_or_credit === "cash") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Cannot update paid or cash expense",
        data: null,
      };
    }

    const {
      cash_or_credit,
      paymentMethod,
      amount,
      remarks,
      categoryId,
      accountId,
    } = req.body;
    if (accountId) {
      const account = await Account.findByPk(accountId, { transaction });
      if (!account || account.status !== "active") {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Invalid or inactive account",
          data: null,
        };
      }
    }
    if (categoryId) {
      const category = await expenseCategoryModel.findByPk(categoryId, {
        transaction,
      });
      if (!category || !category.isActive) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Invalid or inactive category",
          data: null,
        };
      }
    }

    const updateData = {};
    if (cash_or_credit) updateData.cash_or_credit = cash_or_credit;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (amount) updateData.amount = amount;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (accountId) updateData.accountId = accountId;

    await expense.update(updateData, { transaction });

    const result = await expenseModel.findByPk(expense.id, {
      include: [
        { model: expenseCategoryModel, as: "category" },
        { model: Account, as: "account" },
      ],
      transaction,
    });

    await transaction.commit();
    return {
      ...generalConstant.EN.EXPENSE.UPDATE_EXPENSE_SUCCESS,
      data: result,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const recordCreditPayment = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const expense = await expenseModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!expense) {
      await transaction.rollback();
      return { ...generalConstant.EN.EXPENSE.EXPENSE_NOT_FOUND, data: null };
    }
    if (expense.cash_or_credit !== "credit") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Not a credit expense",
        data: null,
      };
    }
    if (expense.paymentDate) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Expense already paid",
        data: null,
      };
    }

    const paymentAccountId = req.body.paymentAccountId || expense.accountId;
    const account = await Account.findByPk(paymentAccountId, { transaction });
    if (!account || account.status !== "active") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Invalid or inactive payment account",
        data: null,
      };
    }

    if (Number(account.currentBalance) < Number(expense.amount)) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Insufficient account balance",
        data: null,
      };
    }

    await expense.update(
      {
        paymentAccountId,
        paymentDate: new Date(),
      },
      { transaction },
    );

    await account.decrement("currentBalance", {
      by: Number(expense.amount),
      transaction,
    });

    const result = await expenseModel.findByPk(expense.id, {
      include: [
        { model: expenseCategoryModel, as: "category" },
        { model: Account, as: "account" },
        { model: Account, as: "paymentAccount" },
      ],
      transaction,
    });

    await transaction.commit();
    return { ...generalConstant.EN.EXPENSE.PAY_EXPENSE_SUCCESS, data: result };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const cancelExpense = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const expense = await expenseModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!expense) {
      await transaction.rollback();
      return { ...generalConstant.EN.EXPENSE.EXPENSE_NOT_FOUND, data: null };
    }
    if (expense.paymentDate || expense.cash_or_credit === "cash") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Cannot cancel paid or cash expense",
        data: null,
      };
    }

    await expense.destroy({ transaction });

    await transaction.commit();
    return { ...generalConstant.EN.EXPENSE.CANCEL_EXPENSE_SUCCESS, data: null };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getUnpaidCredits = async (req) => {
  try {
    const { limit, page, categoryId } = req.query;
    const filters = { cash_or_credit: "credit", paymentDate: null };
    if (categoryId) filters.categoryId = +categoryId;

    const result = await paginate(expenseModel, {
      limit,
      page,
      filters,
      order: [["createdAt", "ASC"]],
      include: [
        { model: expenseCategoryModel, as: "category" },
        { model: Account, as: "account" },
      ],
    });

    if (!result) {
      return {
        ...generalConstant.EN.EXPENSE.UNPAID_CREDITS_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.EXPENSE.UNPAID_CREDITS_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  list,
  getById,
  updateById,
  recordCreditPayment,
  cancelExpense,
  getUnpaidCredits,
};
