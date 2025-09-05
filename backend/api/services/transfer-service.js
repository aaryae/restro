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
      console.log("paisa kam#####-----333-3-3-3-");
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

module.exports = {
  createTransfer,
};
