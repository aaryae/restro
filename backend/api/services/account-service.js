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
      staticQrUrl,
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
          staticQrUrl,
        },
        { transaction },
      );
    } else if (accountType === "wallet") {
      typeSpecificAccount = await walletAccountModel.create(
        {
          accountId: account.id,
          walletId,
          staticQrUrl,
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

// const deleteAccount = async (req) => {
//   const transaction = await sequelize.transaction();
//   try {
//     const { id } = req.params;
//     const account = await accountModel.findByPk(id, {
//       include: [
//         { model: bankAccountModel, as: "bankAccount" },
//         { model: walletAccountModel, as: "walletAccount" },
//         { model: cashAccountModel, as: "cashAccount" },
//       ],
//       transaction,
//     });
//     if (!account) {
//       await transaction.rollback();
//       return { status: 404, success: false, message: "Account not found" };
//     }
//     if (account.isDefault) {
//       await transaction.rollback();
//       return {
//         status: 401,
//         success: false,
//         message: "Default Account cannot be deleted",
//       };
//     }

//     // Delete type-specific records first
//     if (account.bankAccount) await account.bankAccount.destroy({ transaction });
//     if (account.walletAccount)
//       await account.walletAccount.destroy({ transaction });
//     if (account.cashAccount) await account.cashAccount.destroy({ transaction });

//     await account.destroy({ transaction });

//     await transaction.commit();
//     return {
//       status: 200,
//       success: true,
//       message: "Account deleted successfully",
//       data: { id: Number(id) },
//     };
//   } catch (error) {
//     await transaction.rollback();
//     throw error;
//   }
// };
const getAccountByID = async (req) => {
  try {
    const { id } = req.params;
    const account = await accountModel.findByPk(id, {
      include: [
        { model: bankAccountModel, as: "bankAccount" },
        { model: walletAccountModel, as: "walletAccount" },
        { model: cashAccountModel, as: "cashAccount" },
      ],
    });
    if (!account) {
      return { status: 404, success: false, message: "Account not found" };
    }
    return {
      status: 200,
      success: true,
      message: "Account retrieved successfully",
      data: account,
    };
  } catch (error) {
    throw error;
  }
};

const updateAccount = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      name,
      description,
      openingBalance,
      accountType, // optional, but we do not allow changing type once created
      bankAccountNumber,
      walletId,
      staticQrUrl,
      status,
    } = req.body;

    const account = await accountModel.findByPk(id, {
      include: [
        { model: bankAccountModel, as: "bankAccount" },
        { model: walletAccountModel, as: "walletAccount" },
        { model: cashAccountModel, as: "cashAccount" },
      ],
      transaction,
    });

    if (!account) {
      await transaction.rollback();
      return { status: 404, success: false, message: "Account not found" };
    }

    if (accountType && accountType !== account.accountType) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Changing account type is not allowed",
      };
    }

    // Update base account fields (only provided)
    const baseUpdates = {};
    if (name !== undefined) baseUpdates.name = name;
    if (description !== undefined) baseUpdates.description = description;
    if (openingBalance !== undefined)
      baseUpdates.openingBalance = openingBalance;
    if (status !== undefined) {
      const newStatus = String(status).toLowerCase();
      if (!["active", "inactive"].includes(newStatus)) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Invalid status value",
        };
      }
      if (newStatus === "inactive" && account.isDefault) {
        await transaction.rollback();
        return {
          status: 401,
          success: false,
          message: "Default Account cannot be inactive",
        };
      }
      baseUpdates.status = newStatus;
    }

    if (Object.keys(baseUpdates).length > 0) {
      await account.update(baseUpdates, { transaction });
    }

    // Update type-specific details
    if (account.accountType === "bank") {
      if (!account.bankAccount) {
        await bankAccountModel.create(
          {
            accountId: account.id,
            bankAccountNumber: bankAccountNumber,
            staticQrUrl,
          },
          { transaction },
        );
      } else {
        const updates = {};
        if (bankAccountNumber !== undefined)
          updates.bankAccountNumber = bankAccountNumber;
        if (staticQrUrl !== undefined) updates.staticQrUrl = staticQrUrl;
        if (Object.keys(updates).length > 0) {
          await account.bankAccount.update(updates, { transaction });
        }
      }
    } else if (account.accountType === "wallet") {
      if (!account.walletAccount) {
        await walletAccountModel.create(
          { accountId: account.id, walletId, staticQrUrl },
          { transaction },
        );
      } else {
        const updates = {};
        if (walletId !== undefined) updates.walletId = walletId;
        if (staticQrUrl !== undefined) updates.staticQrUrl = staticQrUrl;
        if (Object.keys(updates).length > 0) {
          await account.walletAccount.update(updates, { transaction });
        }
      }
    }

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: "Account updated successfully",
      data: account,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const changeStatus = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    // Find the account entry
    const account = await accountModel.findByPk(id, { transaction });
    if (!account) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: "Account entry not found",
      };
    }

    if (account.isDefault) {
      await transaction.rollback();
      return {
        status: 401,
        success: false,
        message: "Default Account cannot be inactive",
      };
    }

    const result = await account.update(
      {
        status: account.status === "active" ? "inactive" : "active",
      },
      { transaction },
    );

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: "Account status changed successfully",
      data: result,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const changeDefaultAccount = async (req) => {
  const transaction = await accountModel.sequelize.transaction();
  try {
    const { id } = req.params; // Validated by middleware

    // Find the account entry
    const account = await accountModel.findByPk(id, { transaction });
    if (!account) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: "Account entry not found",
      };
    }

    // Ensure account is active before making it default
    if (account.status !== "active") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Account must be active to be set as default",
      };
    }

    // Set all accounts to isDefault: false
    await accountModel.update({ isDefault: false }, { where: {}, transaction });

    // Set the specified account to isDefault: true
    await account.update({ isDefault: true }, { transaction });

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: "Default account changed successfully",
      data: {
        account: {
          id: account.id,
          accountType: account.accountType,
          isDefault: true,
          updatedAt: account.updatedAt,
        },
      },
    };
  } catch (error) {
    await transaction.rollback();
    console.error("[changeDefaultAccount] Error:", error.message);
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
  updateAccount,
  getAccountByID,
  changeStatus,
  changeDefaultAccount,
};
