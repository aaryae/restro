const {
  accountModel,
  userModel,
  transferModel,
  sequelize,
} = require("../../models");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");

const createTransfer = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { fromAccountId, toAccountId, userId, amount, remarks } = req.body;

    // Validate accounts and user existence
    const fromAccount = await accountModel.findByPk(fromAccountId, {
      transaction,
    });
    const toAccount = await accountModel.findByPk(toAccountId, { transaction });
    const user = await userModel.findByPk(userId, { transaction });

    if (!fromAccount) {
      throw new Error("Source account not found");
    }
    if (!toAccount) {
      throw new Error("Destination account not found");
    }
    if (!user) {
      throw new Error("User not found");
    }

    // Check account status
    if (fromAccount.status !== "active" || toAccount.status !== "active") {
      throw new Error("Both source and destination accounts must be active");
    }

    // Check sufficient balance
    if (fromAccount.currentBalance < amount) {
      throw new Error("Insufficient balance in source account");
    }

    // Update account balances
    await fromAccount.update(
      { currentBalance: Number(fromAccount.currentBalance) - amount },
      { transaction },
    );
    await toAccount.update(
      {
        openingBalance: Number(toAccount.currentBalance) + amount,
        currentBalance: Number(toAccount.currentBalance) + amount,
      },

      { transaction },
    );

    console.log(fromAccount, toAccount);

    // Create transfer record
    const transfer = await transferModel.create(
      {
        fromAccountId,
        toAccountId,
        userId,
        amount,
        remarks,
        transferDate: new Date(),
      },
      { transaction },
    );

    await transaction.commit();

    return {
      status: 201,
      success: true,
      message: "Transfer created successfully",
      data: { transfer },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const list = async (req) => {
  try {
    let { limit, page, fromAccountId, toAccountId, userId } = req.query;
    const filters = {};
    const include = [
      { model: accountModel, as: "fromAccount" },
      { model: accountModel, as: "toAccount" },
      { model: userModel, as: "user" },
    ];

    if (fromAccountId) {
      filters.fromAccountId = {
        [Op.like]: `%${fromAccountId}%`,
      };
    }
    if (toAccountId) {
      filters.toAccountId = {
        [Op.like]: `%${toAccountId}%`,
      };
    }
    if (userId) {
      filters.userId = {
        [Op.like]: `%${userId}%`,
      };
    }

    const result = await paginate(transferModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        status: 500,
        success: false,
        message: "Transfer List Failed",
      };
    }
    return {
      status: 200,
      success: true,
      message: "Transfer List successful",
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createTransfer,
  list,
};
