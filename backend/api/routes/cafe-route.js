"use strict";

const router = require("express").Router();
const {
  getTrialStatus,
  selfExtendTrial,
} = require("../controllers/cafe-trial-controller");
const { authentication } = require("../../middlewares/auth-middleware");

/** POS trial lifecycle — works even when cafe status is expired. */
router.get("/trial", authentication, getTrialStatus);
router.post("/trial/extend", authentication, selfExtendTrial);

module.exports = router;
