const { Op, literal } = require("sequelize");
const {
  revenueModel,
  orderModel,
  tableModel,
  purchaseModel,
  expenseModel,
  sequelize,
  accountModel,
  Sequelize,
} = require("../../models");
const { startOfDay, endOfDay } = require("date-fns");
const currentDate = new Date();
const todayStart = startOfDay(currentDate);
const todayEnd = endOfDay(currentDate);
const createdToday = { [Op.between]: [todayStart, todayEnd] };

const getAccountsRevenue = async (req, res) => {
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

const getAccountsPurchase = async (req, res) => {
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

const getAccountsExpense = async (req, res) => {
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

const getClosingBalance = async () => {
  const closingBalance = await accountModel.sum("currentBalance");
  return closingBalance;
};

const getAccountNetChange = (
  accountsRevenue,
  accountsExpense,
  accountsPurchase,
) => {
  const overAllRevenue = accountsRevenue?.[0]?.overAllTotal || 0;
  const overAllExpense = accountsExpense?.[0]?.overallTotal || 0;
  const overAllPurchase = accountsPurchase?.[0]?.overAllTotal || 0;

  return overAllRevenue - (overAllPurchase + overAllExpense);
};

module.exports.getDailySummary = async (req) => {
  try {
    const accountsRevenue = await getAccountsRevenue();
    const accountsPurchase = await getAccountsPurchase();
    const accountsExpense = await getAccountsExpense();
    const closingBalance = await getClosingBalance();
    const netChange = getAccountNetChange(
      accountsRevenue,
      accountsExpense,
      accountsPurchase,
    );
    const openingBalance = closingBalance - netChange;
    const result = {
      accountsRevenue,
      accountsPurchase,
      accountsExpense,
      closingBalance,
      openingBalance,
    };
    return {
      status: 200,
      success: true,
      message: "Daily Summary retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("Daily summary error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const formatTableReport = (rawReport) => {
  const tableMap = rawReport.reduce((acc, row) => {
    const tableNo = row.tableNo;
    const tableId = row.TableId;
    if (!acc[tableId]) {
      acc[tableId] = {
        id: tableId,
        name: tableNo,
        accounts: [],
      };
    }
    acc[tableId].accounts.push({
      name: row.accountName || "Unknown",
      total: parseFloat(row.totalRevenue) || 0,
    });
    return acc;
  }, {});

  console.log(tableMap);

  const tables = Object.values(tableMap);

  // Sort accounts within each table by total desc
  tables.forEach((table) => {
    table.accounts.sort((a, b) => b.total - a.total);
  });

  // Add total per table
  tables.forEach((table) => {
    table.totalRevenue = table.accounts.reduce(
      (sum, acc) => sum + acc.total,
      0,
    );
  });

  return tables;
};

const getTableRevenueReport = async () => {
  const todayTableReport = await revenueModel.findAll({
    attributes: [
      [Sequelize.col("order->table.tableNo"), "tableNo"],
      [Sequelize.col("order->table.id"), "TableId"],
      [Sequelize.col("account.name"), "accountName"],
      [Sequelize.fn("SUM", Sequelize.col("Revenue.amount")), "totalRevenue"],
    ],
    include: [
      {
        model: orderModel,
        as: "order",
        attributes: [],
        required: true,
        include: {
          model: tableModel,
          as: "table",
          attributes: [],
          required: true,
        },
      },
      {
        model: accountModel,
        as: "account",
        attributes: [],
        required: true,
      },
    ],
    where: {
      createdAt: createdToday,
      orderId: { [Sequelize.Op.ne]: null },
      accountId: { [Sequelize.Op.ne]: null },
    },
    group: [
      Sequelize.col("order->table.id"),
      Sequelize.col("order->table.tableNo"),
      Sequelize.col("account.name"),
    ],
    order: [[Sequelize.col("totalRevenue"), "DESC"]],
    raw: true,
  });
  return formatTableReport(todayTableReport);
};

module.exports.getDailyRevenueReport = async (req) => {
  try {
    const accountsRevenue = await getAccountsRevenue();
    const todayTableReport = await getTableRevenueReport();
    const result = {
      accountsRevenue,
      todayTableReport,
    };
    return {
      status: 200,
      success: true,
      message: "Daily Revenue Report retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("Daily Revenue Report error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};
