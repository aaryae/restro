"use strict";

const router = require("express").Router();
const { authentication } = require("../../middlewares/auth-middleware");
const { idValidation } = require("../../validations/common-validation");
const {
  listOpen,
  markHandled,
} = require("../controllers/service-request-controller");

// POS floor staff — any authenticated cafe session can see/handle guest requests.
router.get("/open", authentication, listOpen);
router.patch("/:id/handled", authentication, idValidation, markHandled);

module.exports = router;
