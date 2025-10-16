const { Op, literal } = require("sequelize");
const {
  revenueModel,
  purchaseModel,
  expenseModel,
  sequelize,
  accountModel,
} = require("../../models");
const { startOfDay, endOfDay } = require("date-fns");
const currentDate = new Date();
const todayStart = startOfDay(currentDate);
const todayEnd = endOfDay(currentDate);
const createdToday = { [Op.between]: [todayStart, todayEnd] };

module.exports.getAccountsRevenue = async (req, res) => {
  const todayTotalRevenue = await revenueModel.findAll({
    attributes: [
      "accountId",
      [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"],
      [literal("SUM(SUM(amount)) OVER ()"), "overallTotal"],
    ],
    group: ["accountId"],
    raw: true,
    where: {
      createdAt: createdToday,
    },
    include: {
      model: accountModel,
      as: "account",
      attributes: ["name"],
    },
  });

  return todayTotalRevenue;
};

module.exports.getAccountsPurchase = async (req, res) => {
  const todayTotalPurchase = await purchaseModel.findAll({
    attributes: [
      "accountId",
      [sequelize.fn("SUM", sequelize.col("totalAmount")), "totalAmount"],
      [literal("SUM(SUM(totalAmount)) OVER ()"), "overallTotal"],
    ],
    group: ["accountId"],
    where: {
      paymentDate: createdToday,
      status: { [Op.ne]: "cancelled" },
    },
    include: {
      model: accountModel,
      as: "account",
      attributes: ["name"],
    },
  });

  return todayTotalPurchase;
};

module.exports.getAccountsExpense = async (req, res) => {
  const todayTotalExpense = await expenseModel.findAll({
    attributes: [
      "accountId",
      [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"],
      [literal("SUM(SUM(amount)) OVER ()"), "overallTotal"],
    ],
    group: ["accountId"],
    raw: true,
    where: {
      paymentDate: createdToday,
    },
    include: {
      model: accountModel,
      as: "account",
      attributes: ["name"],
    },
  });

  return todayTotalExpense;
};
