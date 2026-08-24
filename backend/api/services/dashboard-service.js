const { Op, Sequelize } = require("sequelize");
const accountService = require("./account-service");
const revenueService = require("./revenue-service");
const purchaseService = require("./purchase-service");
const expenseService = require("./expense-service");
const transactionService = require("./transaction-service");
const companySettingsService = require("./company-settings-service");
const { orderModel, revenueModel, sequelize } = require("../../models");

const overview = async (req) => {
  try {
    const purchaseStatus = req.query.purchaseStatus || "completed";
    const purchaseReq = {
      ...req,
      query: { ...req.query, status: purchaseStatus },
    };

    const [
      balancesRes,
      revenueRes,
      purchaseRes,
      expenseRes,
      transactionRes,
      settingsRes,
    ] = await Promise.all([
      accountService.totalAndBalances(req),
      revenueService.totalRevenue(req),
      purchaseService.totalPurchase(purchaseReq),
      expenseService.totalExpense(req),
      transactionService.total(req),
      companySettingsService.getOne(),
    ]);

    const totalRevenue = revenueRes?.success
      ? Number(revenueRes.data?.total || 0)
      : 0;
    const totalPurchase = purchaseRes?.success
      ? Number(purchaseRes.data?.total || 0)
      : 0;
    const totalExpense = expenseRes?.success
      ? Number(expenseRes.data?.total || 0)
      : 0;
    const profit = totalRevenue - (totalPurchase + totalExpense);

    const totalDeposit = transactionRes?.success
      ? Number(transactionRes.data?.totalDeposit || 0)
      : 0;
    const totalWithdraw = transactionRes?.success
      ? Number(transactionRes.data?.totalWithdraw || 0)
      : 0;

    const accounts = balancesRes?.success
      ? balancesRes.data?.accounts || []
      : [];
    const totalCollectionBalance = accounts.reduce(
      (sum, account) => sum + Number(account.currentBalance || 0),
      0,
    );

    const openingBalance = settingsRes?.success
      ? Number(settingsRes.data?.openingBalance || 0)
      : 0;

    return {
      status: 200,
      success: true,
      message: "Dashboard overview retrieved successfully",
      data: {
        totalRevenue,
        totalPurchase,
        totalExpense,
        profit,
        totalDeposit,
        totalWithdraw,
        netTransaction: totalDeposit - totalWithdraw,
        remainingBalance:
          profit + totalDeposit - totalWithdraw,
        totalCollectionBalance: parseFloat(totalCollectionBalance.toFixed(2)),
        accounts,
        openingBalance,
      },
    };
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return {
      status: 500,
      success: false,
      message: "Failed to retrieve dashboard overview",
      error: error.message,
    };
  }
};

// Daily revenue for trend charts: order sales plus manually added revenue entries
const dailySales = async (req) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 90);

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));

    const toYmd = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const startYmd = toYmd(start);
    const endYmd = toYmd(end);
    const rangeStart = new Date(`${startYmd}T00:00:00.000Z`);
    const rangeEnd = new Date(`${endYmd}T23:59:59.999Z`);

    const rows = await orderModel.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("orderStartTime")), "date"],
        [sequelize.fn("SUM", sequelize.col("totalAmount")), "amount"],
      ],
      where: {
        status: { [Op.ne]: "cancelled" },
        paymentStatus: { [Op.in]: ["paid", "partially_paid"] },
        orderStartTime: { [Op.between]: [rangeStart, rangeEnd] },
      },
      group: [sequelize.fn("DATE", sequelize.col("orderStartTime"))],
      raw: true,
    });

    const byDate = new Map(
      rows.map((r) => [
        String(r.date).slice(0, 10),
        Number(r.amount) || 0,
      ]),
    );

    const manualRows = await revenueModel.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
        [sequelize.fn("SUM", sequelize.col("amount")), "amount"],
      ],
      where: {
        // Robust "manual revenue" detection: manually created revenues have no linked order.
        // In case historical data contains 0 instead of NULL, include that too.
        [Op.or]: [{ orderId: null }, { orderId: 0 }],
        createdAt: { [Op.between]: [rangeStart, rangeEnd] },
      },
      group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
      raw: true,
    });

    for (const row of manualRows) {
      const ymd = String(row.date).slice(0, 10);
      byDate.set(ymd, (byDate.get(ymd) || 0) + (Number(row.amount) || 0));
    }

    const data = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const ymd = toYmd(d);
      data.push({ date: ymd, amount: byDate.get(ymd) || 0 });
    }

    return {
      status: 200,
      success: true,
      message: "Daily sales summary retrieved successfully",
      data,
    };
  } catch (error) {
    console.error("Dashboard daily sales error:", error);
    return {
      status: 500,
      success: false,
      message: "Failed to retrieve daily sales summary",
      error: error.message,
    };
  }
};

module.exports = {
  overview,
  dailySales,
};
