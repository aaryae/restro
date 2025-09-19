const {
  expenseModel,
  expenseCategoryModel,
  accountModel,
  supplierModel,
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
      supplierId,
    } = req.body;

    // Validate input
    if (!["cash", "credit"].includes(cash_or_credit)) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Invalid cash_or_credit value",
        data: null,
      };
    }
    if (!["cash", "card", "online"].includes(paymentMethod)) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Invalid paymentMethod value",
        data: null,
      };
    }
    if (amount < 0) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Amount must be non-negative",
        data: null,
      };
    }

    // Validate references
    const account = await accountModel.findByPk(accountId, {
      transaction,
    });
    if (!account || account.status !== "active") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Invalid or inactive account",
        data: null,
      };
    }

    // Check balance
    if (Number(account.currentBalance) < Number(amount)) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Insufficient account balance",
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

    if (supplierId) {
      const supplier = await supplierModel.findByPk(supplierId, {
        transaction,
      });
      if (!supplier) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Invalid supplier",
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
        supplierId,
        paymentDate: new Date(),
      },
      { transaction },
    );

    const result = await expenseModel.findByPk(expense.id, {
      include: [
        { model: expenseCategoryModel, as: "category" },
        { model: accountModel, as: "account" },
        { model: supplierModel, as: "supplier" },
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
        { model: accountModel, as: "account" },
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
        { model: accountModel, as: "account" },
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
    // Allow updating even if paid or cash expense; hooks will handle balance adjustments

    const {
      cash_or_credit,
      paymentMethod,
      amount,
      remarks,
      categoryId,
      accountId,
    } = req.body;
    // Do not allow changing the associated account in an update to avoid
    // double/missed balance adjustments with model hooks.
    if (accountId && Number(accountId) !== Number(expense.accountId)) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Changing account on an existing expense is not allowed",
        data: null,
      };
    }
    // Validate current associated account
    const currentAccount = await accountModel.findByPk(expense.accountId, { transaction });
    if (!currentAccount || currentAccount.status !== "active") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Invalid or inactive associated account",
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

    const updateData = {};
    if (cash_or_credit) updateData.cash_or_credit = cash_or_credit;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    // Determine and validate amount change against account balance
    const oldAmount = Number(expense.amount) || 0;
    const newAmount = amount !== undefined ? Number(amount) : oldAmount;
    if (Number.isNaN(newAmount) || newAmount < 0) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Amount must be a non-negative number",
        data: null,
      };
    }
    const amountDifference = newAmount - oldAmount;
    if (amountDifference > 0) {
      // Increasing expense: ensure sufficient balance in associated account
      if (Number(currentAccount.currentBalance) < Number(amountDifference)) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Insufficient account balance for increased expense amount",
          data: null,
        };
      }
    }
    if (amount !== undefined) updateData.amount = newAmount;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    // We already disallow changing accountId, so do not update it here

    await expense.update(updateData, { transaction });

    const result = await expenseModel.findByPk(expense.id, {
      include: [
        { model: expenseCategoryModel, as: "category" },
        { model: accountModel, as: "account" },
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
    const account = await accountModel.findByPk(paymentAccountId, {
      transaction,
    });
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
        { model: accountModel, as: "account" },
        { model: accountModel, as: "paymentAccount" },
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
    // Allow deleting any expense; refund will be handled by the Expense.afterDestroy hook

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
        { model: accountModel, as: "account" },
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
