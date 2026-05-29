const { Op, literal } = require("sequelize");
const {
  revenueModel,
  orderItemModel,
  orderModel,
  tableModel,
  purchaseModel,
  expenseModel,
  sequelize,
  accountModel,
  productModel,
  addonModel,
  Sequelize,
} = require("../../models");
const { startOfDay, endOfDay } = require("date-fns");
const { parseLocalDate, getLocalDateRange, getTimezone } = require("../../utils/timezone");

const getDateRange = (req) => {
  const { start, end } = req.query;

  if (start && end) {
    return getLocalDateRange(start, end);
  }

  const currentDate = new Date();
  return {
    start: startOfDay(currentDate),
    end: endOfDay(currentDate),
  };
};

const createdDateRange = (req) => {
  const { start, end } = getDateRange(req);
  return { [Op.between]: [start, end] };
};

const getAccountsRevenue = async (req) => {
  const dateFilter = createdDateRange(req);
  const todayTotalRevenue = await revenueModel.findAll({
    attributes: [
      "accountId",
      [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"],
      [literal("SUM(SUM(amount)) OVER ()"), "overallTotal"],
    ],
    group: ["accountId"],
    raw: true,
    where: {
      createdAt: createdDateRange(req),
    },
    include: {
      model: accountModel,
      as: "account",
      attributes: ["name"],
    },
  });

  return todayTotalRevenue;
};

const getAccountsPurchase = async (req) => {
  const todayTotalPurchase = await purchaseModel.findAll({
    attributes: [
      "accountId",
      [sequelize.fn("SUM", sequelize.col("totalAmount")), "totalAmount"],
      [literal("SUM(SUM(totalAmount)) OVER ()"), "overallTotal"],
    ],
    group: ["accountId"],
    where: {
      paymentDate: createdDateRange(req),
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

const getAccountsExpense = async (req) => {
  const todayTotalExpense = await expenseModel.findAll({
    attributes: [
      "accountId",
      [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"],
      [literal("SUM(SUM(amount)) OVER ()"), "overallTotal"],
    ],
    group: ["accountId"],
    raw: true,
    where: {
      paymentDate: createdDateRange(req),
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

const getTableRevenueReport = async (req) => {
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
      createdAt: createdDateRange(req),
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
    const accountsRevenue = await getAccountsRevenue(req);
    const todayTableReport = await getTableRevenueReport(req);
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

const getTableSessions = async (req) => {
  const tableId = parseInt(req.params.id, 10);
  if (isNaN(tableId)) throw new Error("Invalid table ID");

  const orders = await orderModel.findAll({
    attributes: [
      "id",
      "sessionId",
      "orderStartTime",
      "orderFinishTime",
      "totalAmount",
    ],
    where: {
      tableId: tableId,
    },
    include: [
      {
        model: revenueModel,
        as: "revenues",
        where: {
          createdAt: createdDateRange(req),
        },
        required: true,
        attributes: [],
      },
      {
        model: orderItemModel,
        as: "orderItems",
        include: [
          {
            model: productModel,
            as: "product",
            attributes: ["name"],
          },
          {
            model: addonModel,
            as: "addon",
            attributes: ["name"],
          },
        ],
      },
    ],
    order: [
      ["sessionId", "ASC"],
      ["orderStartTime", "ASC"],
    ],
  });

  const sessionMap = orders.reduce((acc, order) => {
    const sessionId = order.sessionId || "unknown";
    if (!acc[sessionId]) {
      acc[sessionId] = {
        sessionId,
        sessionStart: null,
        sessionEnd: null,
        total: 0,
        orders: [],
      };
    }

    const plainOrder = order.toJSON();
    delete plainOrder.revenues;

    const startTime = new Date(plainOrder.orderStartTime);
    const endTime = plainOrder.orderFinishTime
      ? new Date(plainOrder.orderFinishTime)
      : null;
    const amount = parseFloat(plainOrder.totalAmount) || 0;

    if (
      !acc[sessionId].sessionStart ||
      startTime < acc[sessionId].sessionStart
    ) {
      acc[sessionId].sessionStart = startTime;
    }

    if (
      endTime &&
      (!acc[sessionId].sessionEnd || endTime > acc[sessionId].sessionEnd)
    ) {
      acc[sessionId].sessionEnd = endTime;
    } else if (!endTime && !acc[sessionId].sessionEnd) {
      const fallbackEnd = startTime;
      if (
        !acc[sessionId].sessionEnd ||
        fallbackEnd > acc[sessionId].sessionEnd
      ) {
        acc[sessionId].sessionEnd = fallbackEnd;
      }
    }

    // Add to total
    acc[sessionId].total += amount;

    // Push order
    acc[sessionId].orders.push(plainOrder);

    return acc;
  }, {});

  const sessions = Object.values(sessionMap);

  sessions.forEach((session) => {
    session.orders.sort((a, b) => a.id - b.id);

    // Optional: Format dates to ISO or locale string
    if (session.sessionStart) {
      session.sessionStart = session.sessionStart.toISOString();
    }
    if (session.sessionEnd) {
      session.sessionEnd = session.sessionEnd.toISOString();
    }

    // Round total to 2 decimals
    session.total = parseFloat(session.total.toFixed(2));
  });

  // Optional: Sort sessions by sessionStart
  sessions.sort((a, b) => new Date(a.sessionStart) - new Date(b.sessionStart));

  return sessions;
};

module.exports.getDailyTableSessions = async (req) => {
  try {
    const { id } = req.params;
    const table = await tableModel.findByPk(id);
    if (!table) {
      return {
        status: 400,
        success: false,
        message: "Table not found.",
        data: null,
      };
    }

    const sessions = await getTableSessions(req);
    return {
      status: 200,
      success: true,
      message: "Sessions retrieved successfully",
      data: sessions,
    };
  } catch (error) {
    console.error("Daily table sessions error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};
