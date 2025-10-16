const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const { getDailySummary } = require("../controllers/report-controller");

router.get("/daily-summary", getDailySummary);

module.exports = router;
