const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  getDailySummary,
  getDailyRevenueReport,
  getDailyTableSessions,
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

module.exports = router;
