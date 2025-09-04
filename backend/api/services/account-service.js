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
      name,
      bankAccountNumber,
      walletId,
    } = req.body;

    // Create Account record
    const account = await accountModel.create(
      {
        accountType,
        openingBalance,
        currentBalance: openingBalance,
        name,
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
          bankAccountNumber,
        },
        { transaction },
      );
    } else if (accountType === "wallet") {
      typeSpecificAccount = await walletAccountModel.create(
        {
          accountId: account.id,
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
    let { limit, page, accountType } = req.query;
    const filters = {};
    const include = [];

    if (accountType) {
      filters.accountType = {
        [Op.in]: accountType.split(","), // Support multiple types, e.g., "cash,bank"
      };
    }

    const result = await paginate(accountModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        status: 500,
        success: false,
        message: "Account List Failed",
      };
    }

    return {
      status: 200,
      success: true,
      message: "Account List retrieved successfully",
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  list,
  createAccount,
  updateRevenue,
  deleteRevenue,
};
