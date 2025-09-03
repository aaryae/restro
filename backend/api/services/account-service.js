const { Op } = require("sequelize");
const { startOfDay, endOfDay, parseISO } = require("date-fns");
const { generateUUID } = require("../../utils/uuidGenerator");

const {
  customerModel,
  sequelize,
  userModel,
  revenueModel,
  accountModel,
  bankAccountModel,
  walletAccountModel,
  cashAccountModel,
} = require("../../models");

const { withTransaction } = require("../../helpers/order/transaction");

const paginate = require("../../utils/paginate");
const paginateWithAggregate = require("../../utils/paginateWithAggregate");

const createAccount = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      accountType,
      openingBalance,
      description,
      bankAccountName,
      bankAccountNumber,
      walletAccountName,
      walletId,
    } = req.body;

    // Create Account record
    const account = await accountModel.create(
      {
        accountType,
        openingBalance,
        currentBalance: openingBalance,
        description,
      },
      { transaction },
    );

    // Create type-specific account record
    let typeSpecificAccount = null;
    if (accountType === "bank") {
      typeSpecificAccount = await bankAccountModel.create(
        {
          accountId: account.id,
          bankAccountName,
          bankAccountNumber,
        },
        { transaction },
      );
    } else if (accountType === "wallet") {
      typeSpecificAccount = await walletAccountModel.create(
        {
          accountId: account.id,
          walletAccountName,
          walletId,
        },
        { transaction },
      );
    } else if (accountType === "cash") {
      typeSpecificAccount = await cashAccountModel.create(
        {
          accountId: account.id,
        },
        { transaction },
      );
    }

    await transaction.commit();

    return {
      status: 201,
      success: true,
      message: "Account created successfully",
      data: {
        account,
        typeSpecificAccount,
      },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateRevenue = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { customerId, ...rest } = req.body;

    // Find the revenue entry
    const revenue = await revenueModel.findByPk(id, { transaction });
    if (!revenue) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: "Revenue entry not found",
      };
    }

    // Handle existing customer if customerId is provided
    if (customerId !== undefined) {
      if (customerId !== null) {
        const customer = await customerModel.findByPk(customerId, {
          transaction,
        });
        if (!customer) {
          await transaction.rollback();
          return {
            status: 404,
            success: false,
            message: "Customer not found",
          };
        }
      }
    }

    // Update only provided fields
    await revenue.update(
      {
        ...rest,
        customerId: customerId !== undefined ? customerId : revenue.customerId,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: "Revenue updated successfully",
      data: revenue,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteRevenue = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    // Find the revenue entry
    const revenue = await revenueModel.findByPk(id, { transaction });
    if (!revenue) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: "Revenue entry not found",
      };
    }

    // Delete the revenue entry
    await revenue.destroy({ transaction });

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: "Revenue deleted successfully",
      data: null,
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
      username,
      customerId,
      amount,
      paymentMethod,
      cash_or_credit = "all",
      sort,
      start,
      end,
    } = req.query;

    const filters = {};
    const include = [
      {
        model: userModel,
        as: "user",
        attributes: ["id", "username"],
      },
      {
        model: customerModel,
        as: "customer",
        attributes: ["id", "email", "firstName"],
      },
    ];
    const order = [["updatedAt", "DESC"]];
    const aggregates = [
      { column: "amount", function: "SUM", alias: "grandTotal" },
    ];

    if (paymentMethod)
      filters.paymentMethod = { [Op.like]: `%${paymentMethod}%` };

    if (cash_or_credit === "cash" || cash_or_credit === "credit")
      filters.cash_or_credit = { [Op.like]: `${cash_or_credit}` };

    if (start && end) {
      const startDate = startOfDay(parseISO(start)); // e.g., 2025-08-29T00:00:00.000Z
      const endDate = endOfDay(parseISO(end));

      filters.orderStartTime = { [Op.between]: [startDate, endDate] };
    }

    if (sort) {
      if (sort === "price") order.push(["totalAmount", "DESC"]);
      else if (sort === "latest") order.push(["createdAt", "DESC"]);
    }

    const result = await paginateWithAggregate(revenueModel, {
      limit,
      page,
      filters,
      include,
      order,
      aggregates,
    });

    return {
      status: 200,
      success: true,
      message: "Orders retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("List orders error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

module.exports = {
  list,
  createAccount,
  updateRevenue,
  deleteRevenue,
};
