const { Op, literal } = require("sequelize");
const {
  revenueModel,
  orderItemModel,
  orderModel,
  tableModel,
  purchaseModel,
  purchaseItemModel,
  purchaseCategoryModel,
  expenseModel,
  sequelize,
  accountModel,
  productModel,
  productCategoryModel,
  addonModel,
  Sequelize,
} = require("../../models");
const {
  startOfDay,
  endOfDay,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  subDays,
} = require("date-fns");
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
    group: ["accountId", "account.id", "account.name"],
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
      [literal('SUM(SUM("totalAmount")) OVER ()'), "overallTotal"],
    ],
    group: ["accountId", "account.id", "account.name"],
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
    group: ["accountId", "account.id", "account.name"],
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
  const overAllRevenue = accountsRevenue?.[0]?.overallTotal || 0;
  const overAllExpense = accountsExpense?.[0]?.overallTotal || 0;
  const overAllPurchase = accountsPurchase?.[0]?.overallTotal || 0;

  return overAllRevenue - (overAllPurchase + overAllExpense);
};

const COUNTER_CASH_ACCOUNT_ID = 1;

const resolveCounterCashAccountId = async () => {
  const defaultCashAccount = await accountModel.findOne({
    where: { accountType: "cash", isDefault: true, status: "active" },
    attributes: ["id"],
    raw: true,
  });

  return defaultCashAccount?.id || COUNTER_CASH_ACCOUNT_ID;
};

const sumCounterCashRevenue = async (accountId, range) => {
  const amount = await revenueModel.sum("amount", {
    where: {
      accountId,
      createdAt: range,
    },
  });

  return Number(amount || 0);
};

const sumCounterCashExpenses = async (accountId, range) => {
  const amount = await expenseModel.sum("amount", {
    where: {
      accountId,
      createdAt: range,
    },
  });

  return Number(amount || 0);
};

const sumCounterCashPurchases = async (accountId, range) => {
  const [cashPurchases, creditPayments] = await Promise.all([
    purchaseModel.sum("totalAmount", {
      where: {
        accountId,
        status: "completed",
        paymentTerms: { [Op.ne]: "credit" },
        invoiceDate: range,
      },
    }),
    purchaseModel.sum("totalAmount", {
      where: {
        accountId,
        status: "completed",
        paymentTerms: "credit",
        paymentDate: range,
      },
    }),
  ]);

  return Number(cashPurchases || 0) + Number(creditPayments || 0);
};

module.exports.getCounterCashSummary = async (req) => {
  try {
    const { start, end } = getDateRange(req);
    const accountId = await resolveCounterCashAccountId();
    const periodRange = { [Op.between]: [start, end] };

    const [cashRevenue, cashPurchases, cashExpenses, account] =
      await Promise.all([
        sumCounterCashRevenue(accountId, periodRange),
        sumCounterCashPurchases(accountId, periodRange),
        sumCounterCashExpenses(accountId, periodRange),
        accountModel.findByPk(accountId, {
          attributes: ["id", "name", "accountType"],
          raw: true,
        }),
      ]);

    const cashOutflow = cashPurchases + cashExpenses;

    return {
      status: 200,
      success: true,
      message: "Counter cash summary retrieved successfully",
      data: {
        accountId,
        accountName: account?.name || "Counter Cash",
        cashRevenue,
        cashPurchases,
        cashExpenses,
        cashOutflow,
      },
    };
  } catch (error) {
    console.error("Counter cash summary error:", error);
    return {
      status: 500,
      success: false,
      message: "Failed to retrieve counter cash summary",
      error: error.message,
    };
  }
};

module.exports.getDailySummary = async (req) => {
  try {
    const accountsRevenue = await getAccountsRevenue(req);
    const accountsPurchase = await getAccountsPurchase(req);
    const accountsExpense = await getAccountsExpense(req);
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

const toNum = (v) => Number(v) || 0;

const periodBounds = (req) => {
  const range = getDateRange(req);
  return { start: range.start, end: range.end };
};

const previousPeriodBounds = (start, end) => {
  const days = Math.max(1, differenceInCalendarDays(end, start) + 1);
  const prevEnd = subDays(start, 1);
  const prevStart = subDays(prevEnd, days - 1);
  return {
    start: startOfDay(prevStart),
    end: endOfDay(prevEnd),
    days,
  };
};

const sumRevenueInRange = async (start, end) =>
  toNum(
    await revenueModel.sum("amount", {
      where: { createdAt: { [Op.between]: [start, end] } },
    }),
  );

const sumPurchaseInRange = async (start, end) =>
  toNum(
    await purchaseModel.sum("totalAmount", {
      where: {
        invoiceDate: { [Op.between]: [start, end] },
        status: { [Op.ne]: "cancelled" },
      },
    }),
  );

const sumExpenseInRange = async (start, end) =>
  toNum(
    await expenseModel.sum("amount", {
      where: { paymentDate: { [Op.between]: [start, end] } },
    }),
  );

const dailySeries = async (start, end) => {
  const days = eachDayOfInterval({ start, end });
  const series = [];
  for (const day of days) {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const [revenue, purchase, expense] = await Promise.all([
      sumRevenueInRange(dayStart, dayEnd),
      sumPurchaseInRange(dayStart, dayEnd),
      sumExpenseInRange(dayStart, dayEnd),
    ]);
    series.push({
      date: format(day, "yyyy-MM-dd"),
      label: format(day, "MMM d"),
      revenue,
      purchase,
      expense,
      net: revenue - purchase - expense,
    });
  }
  return series;
};

const buildBusinessInsights = ({
  revenue,
  purchase,
  expense,
  net,
  prev,
  purchaseHeavyDays,
}) => {
  const insights = [];
  const margin = revenue > 0 ? (net / revenue) * 100 : null;
  if (margin != null) {
    if (margin >= 25) {
      insights.push({
        tone: "positive",
        title: "Healthy margin",
        body: `Net is ${margin.toFixed(1)}% of revenue for this period.`,
      });
    } else if (margin < 0) {
      insights.push({
        tone: "negative",
        title: "Operating at a loss",
        body: `Costs exceeded revenue by ${CurrencyFmt(Math.abs(net))}. Review purchases and expenses.`,
      });
    } else {
      insights.push({
        tone: "warning",
        title: "Thin margin",
        body: `Net is only ${margin.toFixed(1)}% of revenue. Watch food cost and overhead.`,
      });
    }
  }

  if (prev && prev.revenue > 0) {
    const delta = ((revenue - prev.revenue) / prev.revenue) * 100;
    insights.push({
      tone: delta >= 0 ? "positive" : "negative",
      title: delta >= 0 ? "Revenue up vs prior period" : "Revenue down vs prior period",
      body: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% compared with the previous ${prev.days}-day window.`,
    });
  }

  if (purchaseHeavyDays > 0) {
    insights.push({
      tone: "warning",
      title: "Purchase-heavy days",
      body: `${purchaseHeavyDays} day(s) had purchases higher than revenue — normal for restocking, but watch cash.`,
    });
  }

  const expenseRatio = revenue > 0 ? (expense / revenue) * 100 : null;
  if (expenseRatio != null && expenseRatio >= 20) {
    insights.push({
      tone: "warning",
      title: "Expenses are climbing",
      body: `Operating expenses are ${expenseRatio.toFixed(1)}% of revenue this period.`,
    });
  }

  return insights;
};

const CurrencyFmt = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

module.exports.getBusinessOverview = async (req) => {
  try {
    const { start, end } = periodBounds(req);
    const prev = previousPeriodBounds(start, end);

    const [revenue, purchase, expense, prevRevenue, prevPurchase, prevExpense, series, closingBalance] =
      await Promise.all([
        sumRevenueInRange(start, end),
        sumPurchaseInRange(start, end),
        sumExpenseInRange(start, end),
        sumRevenueInRange(prev.start, prev.end),
        sumPurchaseInRange(prev.start, prev.end),
        sumExpenseInRange(prev.start, prev.end),
        dailySeries(start, end),
        getClosingBalance(),
      ]);

    const net = revenue - purchase - expense;
    const prevNet = prevRevenue - prevPurchase - prevExpense;
    const purchaseHeavyDays = series.filter((d) => d.purchase > d.revenue).length;

    const accountsRevenue = await getAccountsRevenue(req);
    const byAccount = (accountsRevenue || []).map((row) => ({
      accountId: row.accountId,
      name: row["account.name"] || row.name || `Account #${row.accountId}`,
      amount: toNum(row.totalAmount),
    }));

    return {
      status: 200,
      success: true,
      message: "Business overview retrieved successfully",
      data: {
        range: {
          start: format(start, "yyyy-MM-dd"),
          end: format(end, "yyyy-MM-dd"),
          days: Math.max(1, differenceInCalendarDays(end, start) + 1),
        },
        totals: {
          revenue,
          purchase,
          expense,
          net,
          closingBalance: toNum(closingBalance),
          profitMarginPct: revenue > 0 ? Number(((net / revenue) * 100).toFixed(2)) : null,
          purchaseToRevenuePct:
            revenue > 0 ? Number(((purchase / revenue) * 100).toFixed(2)) : null,
          expenseToRevenuePct:
            revenue > 0 ? Number(((expense / revenue) * 100).toFixed(2)) : null,
        },
        previous: {
          days: prev.days,
          revenue: prevRevenue,
          purchase: prevPurchase,
          expense: prevExpense,
          net: prevNet,
          revenueDeltaPct:
            prevRevenue > 0
              ? Number((((revenue - prevRevenue) / prevRevenue) * 100).toFixed(2))
              : null,
          netDeltaPct:
            prevNet !== 0
              ? Number((((net - prevNet) / Math.abs(prevNet)) * 100).toFixed(2))
              : null,
        },
        series,
        revenueByAccount: byAccount,
        insights: buildBusinessInsights({
          revenue,
          purchase,
          expense,
          net,
          prev: { days: prev.days, revenue: prevRevenue },
          purchaseHeavyDays,
        }),
      },
    };
  } catch (error) {
    console.error("Business overview error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

module.exports.getMenuPerformance = async (req) => {
  try {
    const { start, end } = periodBounds(req);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit, 10) || 10));

    const whereOrder = {
      status: { [Op.ne]: "cancelled" },
      paymentStatus: { [Op.in]: ["paid", "partially_paid"] },
      orderStartTime: { [Op.between]: [start, end] },
    };

    const rows = await orderItemModel.findAll({
      attributes: [
        "productId",
        [sequelize.fn("SUM", sequelize.col("OrderItem.quantity")), "qtySold"],
        [sequelize.fn("SUM", sequelize.col("OrderItem.subtotal")), "revenue"],
        [sequelize.fn("AVG", sequelize.col("OrderItem.price")), "avgSoldPrice"],
      ],
      include: [
        {
          model: productModel,
          as: "product",
          attributes: ["id", "name", "price", "isTopSelling"],
          required: true,
          include: [
            {
              model: productCategoryModel,
              as: "product_category",
              attributes: ["id", "name"],
              required: false,
            },
          ],
        },
        {
          model: orderModel,
          as: "order",
          attributes: [],
          where: whereOrder,
          required: true,
        },
      ],
      where: {
        status: { [Op.ne]: "cancelled" },
        productId: { [Op.ne]: null },
      },
      group: [
        "productId",
        "product.id",
        "product.name",
        "product.price",
        "product.isTopSelling",
        "product.product_category.id",
        "product.product_category.name",
      ],
      raw: true,
      nest: true,
    });

    const items = rows.map((r) => {
      const qtySold = toNum(r.qtySold);
      const revenue = toNum(r.revenue);
      const avgSoldPrice = toNum(r.avgSoldPrice);
      const menuPrice = toNum(r.product?.price ?? r["product.price"]);
      const priceDiff = menuPrice > 0 ? avgSoldPrice - menuPrice : null;
      const priceDiffPct =
        menuPrice > 0 ? Number((((avgSoldPrice - menuPrice) / menuPrice) * 100).toFixed(2)) : null;
      return {
        productId: r.productId,
        name: r.product?.name || r["product.name"] || "Unknown",
        category:
          r.product?.product_category?.name ||
          r["product.product_category.name"] ||
          "Uncategorized",
        qtySold,
        revenue,
        avgSoldPrice: Number(avgSoldPrice.toFixed(2)),
        menuPrice,
        priceDiff: priceDiff == null ? null : Number(priceDiff.toFixed(2)),
        priceDiffPct,
        isTopSellingFlag: Boolean(r.product?.isTopSelling ?? r["product.isTopSelling"]),
      };
    });

    const byRevenue = [...items].sort((a, b) => b.revenue - a.revenue);
    const byQty = [...items].sort((a, b) => b.qtySold - a.qtySold);
    const topSellers = byRevenue.slice(0, limit);
    const lowestSellers = [...byQty].reverse().slice(0, limit);

    const categoryMap = new Map();
    for (const item of items) {
      const cur = categoryMap.get(item.category) || { name: item.category, revenue: 0, qtySold: 0 };
      cur.revenue += item.revenue;
      cur.qtySold += item.qtySold;
      categoryMap.set(item.category, cur);
    }
    const categories = [...categoryMap.values()].sort((a, b) => b.revenue - a.revenue);

    const soldIds = new Set(items.map((i) => Number(i.productId)));
    const allProducts = await productModel.findAll({
      attributes: ["id", "name", "price", "isTopSelling"],
      include: [
        {
          model: productCategoryModel,
          as: "product_category",
          attributes: ["name"],
          required: false,
        },
      ],
    });
    const neverSold = allProducts
      .filter((p) => !soldIds.has(Number(p.id)))
      .map((p) => ({
        productId: p.id,
        name: p.name,
        category: p.product_category?.name || "Uncategorized",
        menuPrice: toNum(p.price),
        isTopSellingFlag: Boolean(p.isTopSelling),
      }))
      .slice(0, 25);

    const totalRevenue = items.reduce((s, i) => s + i.revenue, 0);
    const totalQty = items.reduce((s, i) => s + i.qtySold, 0);

    const insights = [];
    if (topSellers[0]) {
      insights.push({
        tone: "positive",
        title: "Star of the period",
        body: `${topSellers[0].name} led sales with ${CurrencyFmt(topSellers[0].revenue)} (${topSellers[0].qtySold} sold).`,
      });
    }
    if (lowestSellers[0] && lowestSellers[0].productId !== topSellers[0]?.productId) {
      insights.push({
        tone: "warning",
        title: "Slowest mover",
        body: `${lowestSellers[0].name} only sold ${lowestSellers[0].qtySold} this period.`,
      });
    }
    if (neverSold.length > 0) {
      insights.push({
        tone: "warning",
        title: "Quiet menu items",
        body: `${neverSold.length} active menu item(s) had zero sales this period — candidates to promote or retire.`,
      });
    }

    return {
      status: 200,
      success: true,
      message: "Menu performance retrieved successfully",
      data: {
        range: {
          start: format(start, "yyyy-MM-dd"),
          end: format(end, "yyyy-MM-dd"),
        },
        summary: {
          itemsSold: items.length,
          totalQty,
          totalRevenue,
          neverSoldCount: neverSold.length,
          avgTicketItem:
            totalQty > 0 ? Number((totalRevenue / totalQty).toFixed(2)) : 0,
        },
        topSellers,
        lowestSellers,
        categories,
        neverSold,
        allItems: byRevenue,
        insights,
      },
    };
  } catch (error) {
    console.error("Menu performance error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

module.exports.getPurchaseVsRevenue = async (req) => {
  try {
    const { start, end } = periodBounds(req);
    const [revenue, purchase, series] = await Promise.all([
      sumRevenueInRange(start, end),
      sumPurchaseInRange(start, end),
      dailySeries(start, end),
    ]);

    const contribution = revenue - purchase;
    const coveragePct =
      revenue > 0 ? Number(((purchase / revenue) * 100).toFixed(2)) : null;
    const pressureDays = series.filter((d) => d.purchase > d.revenue);
    const bestDay = [...series].sort((a, b) => b.revenue - a.revenue)[0] || null;
    const heaviestPurchaseDay = [...series].sort((a, b) => b.purchase - a.purchase)[0] || null;

    const purchases = await purchaseModel.findAll({
      where: {
        invoiceDate: { [Op.between]: [start, end] },
        status: { [Op.ne]: "cancelled" },
      },
      attributes: ["id", "totalAmount"],
      include: [
        {
          model: purchaseItemModel,
          as: "purchaseItems",
          attributes: ["amount", "categoryId"],
          include: [
            {
              model: purchaseCategoryModel,
              as: "category",
              attributes: ["name"],
              required: false,
            },
          ],
        },
      ],
    });

    const categoryTotals = {};
    for (const pur of purchases) {
      const items = pur.purchaseItems || [];
      if (!items.length) {
        const key = "Uncategorized";
        categoryTotals[key] = (categoryTotals[key] || 0) + toNum(pur.totalAmount);
        continue;
      }
      for (const item of items) {
        const key = item.category?.name || "Uncategorized";
        categoryTotals[key] =
          (categoryTotals[key] || 0) + toNum(item.amount || 0);
      }
    }
    const purchaseByCategory = Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const insights = [];
    if (coveragePct != null) {
      if (coveragePct <= 35) {
        insights.push({
          tone: "positive",
          title: "Strong purchase cover",
          body: `Purchases used ${coveragePct}% of revenue — room left for expenses and profit.`,
        });
      } else if (coveragePct > 70) {
        insights.push({
          tone: "negative",
          title: "Purchases eating revenue",
          body: `Purchases took ${coveragePct}% of revenue. Check supplier prices and waste.`,
        });
      } else {
        insights.push({
          tone: "warning",
          title: "Balanced but watch food cost",
          body: `Purchases are ${coveragePct}% of revenue for this window.`,
        });
      }
    }
    if (pressureDays.length) {
      insights.push({
        tone: "warning",
        title: "Cash pressure days",
        body: `On ${pressureDays.length} day(s), purchase spend exceeded that day's revenue.`,
      });
    }
    if (bestDay) {
      insights.push({
        tone: "positive",
        title: "Best sales day",
        body: `${bestDay.label} brought in ${CurrencyFmt(bestDay.revenue)}.`,
      });
    }

    return {
      status: 200,
      success: true,
      message: "Purchase vs revenue retrieved successfully",
      data: {
        range: {
          start: format(start, "yyyy-MM-dd"),
          end: format(end, "yyyy-MM-dd"),
        },
        totals: {
          revenue,
          purchase,
          contribution,
          coveragePct,
          avgDailyRevenue:
            series.length > 0
              ? Number((revenue / series.length).toFixed(2))
              : 0,
          avgDailyPurchase:
            series.length > 0
              ? Number((purchase / series.length).toFixed(2))
              : 0,
        },
        series,
        pressureDays: pressureDays.map((d) => ({
          date: d.date,
          label: d.label,
          revenue: d.revenue,
          purchase: d.purchase,
          gap: Number((d.purchase - d.revenue).toFixed(2)),
        })),
        highlights: {
          bestRevenueDay: bestDay,
          heaviestPurchaseDay,
        },
        purchaseByCategory,
        insights,
      },
    };
  } catch (error) {
    console.error("Purchase vs revenue error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};
