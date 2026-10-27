const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  getDailySummary,
  getDailyRevenueReport,
  getDailyTableSessions,
  getCounterCashSummary,
  getBusinessOverview,
  getMenuPerformance,
  getPurchaseVsRevenue,
} = require("../controllers/report-controller");

router.get("/daily-summary", authentication, authorization, getDailySummary);
router.get(
  "/daily-revenue-report",
  authentication,
  authorization,
  getDailyRevenueReport,
);
router.get(
  "/daily-table-sessions/:id",
  authentication,
  authorization,
  getDailyTableSessions,
);
router.get(
  "/counter-cash",
  authentication,
  authorization,
  getCounterCashSummary,
);
router.get(
  "/business-overview",
  authentication,
  authorization,
  getBusinessOverview,
);
router.get(
  "/menu-performance",
  authentication,
  authorization,
  getMenuPerformance,
);
router.get(
  "/purchase-vs-revenue",
  authentication,
  authorization,
  getPurchaseVsRevenue,
);

module.exports = router;
