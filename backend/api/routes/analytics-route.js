const router = require("express").Router();
const express = require("express");

const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const { getWeeklyAnalytics } = require("../controllers/analytics-controller");

router.get(
  "/weekday-comparison",
  authentication,
  authorization,
  getWeeklyAnalytics,
);

module.exports = router;
