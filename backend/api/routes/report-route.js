const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  getDailySummary,
  getDailyRevenueReport,
} = require("../controllers/report-controller");

router.get("/daily-summary", getDailySummary);
router.get("/daily-revenue-report", getDailyRevenueReport);

module.exports = router;
