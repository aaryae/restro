const { Op } = require("sequelize");
const { startOfDay, endOfDay, parseISO } = require("date-fns");
const { generateUUID } = require("../../utils/uuidGenerator");
const { transferModel } = require("../../models");

const {
  customerModel,
  sequelize,
  userModel,
  revenueModel,
  accountModel,
  bankAccountModel,
  walletAccountModel,
  cashAccountModel,
  accountPermissionModel,
  Sequelize,
} = require("../../models");

const { withTransaction } = require("../../helpers/order/transaction");

const paginate = require("../../utils/paginate");
const paginateWithAggregate = require("../../utils/paginateWithAggregate");

const totalAndBalances = async (req) => {
  try {
    const { id: userId, roleId } = req.user;
    const isSuperAdmin = roleId === 1;

    let accounts;

    if (isSuperAdmin) {
      accounts = await accountModel.findAll({
        where: { status: "active" },
        attributes: [
          "id",
          "name",
          "accountType",
          "currentBalance",
          "openingBalance",
        ],
        include: [
          {
            model: bankAccountModel,
            as: "bankAccount",
            attributes: ["accountId", "bankAccountNumber"],
          },
          {
            model: walletAccountModel,
            as: "walletAccount",
            attributes: ["accountId", "walletId"],
          },
          {
            model: cashAccountModel,
            as: "cashAccount",
            attributes: ["accountId"],
          },
        ],
      });
    } else {
      const accessibleAccounts = await accountPermissionModel.findAll({
        where: { userId, canView: true },
        attributes: ["accountId"],
      });

      const accountIds = accessibleAccounts.map((acc) => acc.accountId);

      if (accountIds.length === 0) {
        return {
          status: 200,
          success: true,
          data: {
            totalBalance: 0,
            accounts: [],
          },
          message: "No accessible accounts found",
        };
      }

      // Use Sequelize.Op.in for array of IDs
      accounts = await accountModel.findAll({
        where: {
          id: { [Sequelize.Op.in]: accountIds }, // Use Op.in for array
          status: "active",
        },
        attributes: [
          "id",
          "name",
          "accountType",
          "currentBalance",
          "openingBalance",
        ],
        include: [
          {
            model: bankAccountModel,
            as: "bankAccount",
            attributes: ["accountId", "bankAccountNumber"],
          },
          {
            model: walletAccountModel,
            as: "walletAccount",
            attributes: ["accountId", "walletId"],
          },
          {
            model: cashAccountModel,
            as: "cashAccount",
            attributes: ["accountId"],
          },
        ],
      });
    }

    // Transform accounts data
    const formattedAccounts = accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.accountType,
      currentBalance: parseFloat(account.currentBalance) || 0,
      accountNumber:
        account.bankAccount?.bankAccountNumber ||
        account.walletAccount?.walletId ||
        "N/A",
    }));

    // Calculate total balance
    const totalBalance = formattedAccounts.reduce(
      (sum, account) => sum + account.currentBalance,
      0,
    );

    return {
      status: 200,
      success: true,
      data: {
        totalBalance: parseFloat(totalBalance.toFixed(2)),
        accounts: formattedAccounts,
      },
      message: "Account balances retrieved successfully",
    };
  } catch (error) {
    console.error("Error in totalAndBalances:", error);
    return {
      status: 500,
      success: false,
      message: "Failed to retrieve account balances",
      error: error.message,
    };
  }
};

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
      isDefault,
    } = req.body;

    // Create Account record
    const account = await accountModel.create(
      {
        accountType,
        openingBalance,
        currentBalance: openingBalance,
        name,
        description,
        isDefault: Boolean(isDefault),
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

const deleteAccount = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
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
    if (account.isDefault) {
      await transaction.rollback();
      return {
        status: 401,
        success: false,
        message: "Default Account cannot be deleted",
      };
    }

    const relatedTransfers = await transferModel.count({
      where: {
        [Op.or]: [{ fromAccountId: id }, { toAccountId: id }],
      },
      transaction,
    });
    if (relatedTransfers > 0) {
      throw new Error(
        "Cannot delete account: there are transfer records associated with this account.",
      );
    }

    // Delete type-specific records first
    if (account.bankAccount) await account.bankAccount.destroy({ transaction });
    if (account.walletAccount)
      await account.walletAccount.destroy({ transaction });
    if (account.cashAccount) await account.cashAccount.destroy({ transaction });

    await account.destroy({ transaction });

    await transaction.commit();
    return {
      status: 200,
      success: true,
      message: "Account deleted successfully",
      data: { id: Number(id) },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const getAccountByID = async (req) => {
  try {
    const { accountId: id } = req.params;
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
      isDefault,
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
    if (openingBalance !== undefined) {
      // Adjust currentBalance by the difference in opening balance while preventing negative currentBalance
      const oldOpening = Number(account.openingBalance) || 0;
      const newOpening = Number(openingBalance);
      if (Number.isNaN(newOpening)) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Invalid openingBalance value",
        };
      }

      const diff = newOpening - oldOpening; // positive -> increase currentBalance, negative -> decrease currentBalance
      const proposedCurrent = Number(account.currentBalance) + diff;

      if (proposedCurrent < 0) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message:
            "Requested opening balance would result in negative current balance",
        };
      }

      baseUpdates.openingBalance = newOpening;
      baseUpdates.currentBalance = proposedCurrent;
    }
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
    if (isDefault !== undefined) {
      const nextDefault = Boolean(isDefault);
      if (nextDefault && account.status !== "active") {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Account must be active to be set as default",
        };
      }
      baseUpdates.isDefault = nextDefault;
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

    // Ensure account is active before marking as primary/default
    if (account.status !== "active") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Account must be active to be set as default",
      };
    }

    // Toggle this account's default flag without clearing other primaries.
    // isDefault means "show in checkout payment options" (multiple allowed).
    const nextDefault = !account.isDefault;
    await account.update({ isDefault: nextDefault }, { transaction });

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: nextDefault
        ? "Account marked as default successfully"
        : "Account unmarked as default successfully",
      data: {
        account: {
          id: account.id,
          accountType: account.accountType,
          isDefault: nextDefault,
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
    let { limit, page, accountType, name } = req.query;
    const filters = {};
    const include = [];

    if (accountType) {
      filters.accountType = {
        [Op.in]: accountType.split(","), // Support multiple types, e.g., "cash,bank"
      };
    }
    if (name) {
      filters.name = {
        [Op.iLike]: `%${name}%`, // Case-insensitive partial match
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
  deleteAccount,
  changeStatus,
  changeDefaultAccount,
  totalAndBalances,
};
