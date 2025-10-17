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

router.get("/daily-summary", getDailySummary);
router.get("/daily-revenue-report", getDailyRevenueReport);
router.get("/daily-sessions/:id", getDailyTableSessions);

module.exports = router;
