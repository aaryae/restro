const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const { paginationValidation } = require("../../validations/common-validation");
const { list } = require("../controllers/stock-history-controller");

router.get("/list", authentication, authorization, paginationValidation, list);

module.exports = router;
