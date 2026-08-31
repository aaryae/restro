const {
  expenseModel,
  expenseCategoryModel,
  accountModel,
  supplierModel,
  sequelize,
} = require("../../models");
const { Sequelize, Op } = require("sequelize");
const { startOfDay, endOfDay, parseISO } = require("date-fns");
const { getLocalDateRange } = require("../../utils/timezone");
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
        paymentDate: cash_or_credit === "cash" ? new Date() : null,
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

// Group expenses by category with summed amounts for pie charts
const categorySummary = async (req) => {
  try {
    const { start, end, cash_or_credit, paymentMethod, categoryId } = req.query;

    const where = {};
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (cash_or_credit === "cash" || cash_or_credit === "credit")
      where.cash_or_credit = cash_or_credit;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (start && end) {
      const startDate = startOfDay(parseISO(start));
      const endDate = endOfDay(parseISO(end));
      where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    const rows = await expenseModel.findAll({
      attributes: [
        "categoryId",
        [Sequelize.col("category.name"), "name"],
        [Sequelize.fn("SUM", Sequelize.col("Expense.amount")), "value"],
      ],
      include: [
        {
          model: expenseCategoryModel,
          as: "category",
          attributes: [],
          required: false,
        },
      ],
      where,
      group: ["categoryId", "category.id", "category.name"],
      order: [[Sequelize.fn("SUM", Sequelize.col("Expense.amount")), "DESC"]],
      raw: true,
    });

    const data = rows
      .map((row) => ({
        name: row.name || "Uncategorized",
        value: Number(row.value) || 0,
      }))
      .filter((row) => row.value > 0);

    return {
      status: 200,
      success: true,
      message: "Expense category summary retrieved successfully",
      data,
    };
  } catch (error) {
    throw error;
  }
};

const list = async (req) => {
  try {
    const { limit, page, categoryId, cash_or_credit, start, end, date } = req.query;
    const filters = {};
    if (categoryId) filters.categoryId = +categoryId;
    if (cash_or_credit) filters.cash_or_credit = cash_or_credit;

    // Handle date filtering
    if (date) {
      const dateRange = getLocalDateRange(date, date);
      filters.createdAt = { [Op.between]: [dateRange.start, dateRange.end] };
    } else if (start && end) {
      const dateRange = getLocalDateRange(start, end);
      filters.createdAt = { [Op.between]: [dateRange.start, dateRange.end] };
    }

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

    const grandTotal = await expenseModel.sum("amount", { where: filters });

    return {
      ...generalConstant.EN.EXPENSE.EXPENSE_LIST_SUCCESS,
      data: {
        ...result,
        grandTotal: parseFloat(grandTotal || 0),
      },
    };
  } catch (error) {
    throw error;
  }
};

// Sum total expense amount with filter support
const totalExpense = async (req) => {
  try {
    const { categoryId, cash_or_credit, paymentMethod, start, end } = req.query;

    const filters = {};
    if (categoryId) filters.categoryId = parseInt(categoryId);
    if (cash_or_credit === "cash" || cash_or_credit === "credit")
      filters.cash_or_credit = cash_or_credit;
    if (paymentMethod) filters.paymentMethod = paymentMethod;

    if (start && end) {
      const startDate = startOfDay(parseISO(start));
      const endDate = endOfDay(parseISO(end));
      filters.createdAt = { [Sequelize.Op.between]: [startDate, endDate] };
    }

    const total = await expenseModel.sum("amount", { where: filters });

    return {
      status: 200,
      success: true,
      message: "Total expense retrieved successfully",
      data: { total: parseFloat(total || 0) },
    };
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
        { model: supplierModel, as: "supplier" },
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
      supplierId,
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
    const currentAccount = await accountModel.findByPk(expense.accountId, {
      transaction,
    });
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
    if (supplierId !== undefined) updateData.supplierId = supplierId;
    // We already disallow changing accountId, so do not update it here

    await expense.update(updateData, { transaction });

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

// Daily expense summary
const todayExpense = async (req) => {
  try {
    const { start, end } = req.query;
    
    let startDate, endDate, targetDate;
    
    if (start && end) {
      const dateRange = getLocalDateRange(start, end);
      startDate = dateRange.start;
      endDate = dateRange.end;
      targetDate = start;
    } else {
      targetDate = new Date().toISOString().split("T")[0];
      const dateRange = getLocalDateRange(targetDate, targetDate);
      startDate = dateRange.start;
      endDate = dateRange.end;
    }

    const expenseFilters = {
      createdAt: { [Op.between]: [startDate, endDate] },
    };

    const total = await expenseModel.sum("amount", {
      where: expenseFilters,
    });

    const expensesByCategory = await expenseModel.findAll({
      attributes: [
        "categoryId",
        [sequelize.col("category.name"), "categoryName"],
        [sequelize.fn("SUM", sequelize.col("amount")), "totalExpense"],
        [sequelize.fn("COUNT", sequelize.col("Expense.id")), "itemCount"],
      ],
      where: expenseFilters,
      include: [
        {
          model: expenseCategoryModel,
          as: "category",
          attributes: [],
          required: false,
        },
      ],
      group: ["categoryId", "category.id", "category.name"],
      order: [[sequelize.fn("SUM", sequelize.col("amount")), "DESC"]],
      raw: true,
    });

    return {
      status: 200,
      success: true,
      message: "Today's expense retrieved successfully",
      data: {
        date: targetDate,
        totalExpense: parseFloat(total || 0),
        categories: expensesByCategory.map((e) => ({
          categoryName: e.categoryName || "Uncategorized",
          totalExpense: parseFloat(e.totalExpense || 0),
        })),
      },
    };
  } catch (error) {
    console.error("Today's expense error:", error);
    return {
      status: 500,
      success: false,
      message: "Failed to retrieve today's expense",
      error: error.message,
    };
  }
};

// Daily expense totals for trend charts (keyed by createdAt local day)
const dailySummary = async (req) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 90);

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));

    const toYmd = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const data = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const ymd = toYmd(d);
      const range = getLocalDateRange(ymd, ymd);
      const total = await expenseModel.sum("amount", {
        where: {
          createdAt: { [Op.between]: [range.start, range.end] },
        },
      });
      data.push({ date: ymd, amount: Number(total) || 0 });
    }

    return {
      status: 200,
      success: true,
      message: "Expense daily summary retrieved successfully",
      data,
    };
  } catch (error) {
    console.error("Expense daily summary error:", error);
    return {
      status: 500,
      success: false,
      message: "Failed to retrieve expense daily summary",
      error: error.message,
    };
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
  totalExpense,
  categorySummary,
  todayExpense,
  dailySummary,
};
