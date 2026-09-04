const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  transactionPostValidation,
} = require("../../validations/transaction_validation");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");

const {
  create,
  list,
  getTransactionByID,
  totalTransaction,
} = require("../controllers/transaction-controller");
const {
  checkAccountPermission,
} = require("../../middlewares/accountPermission");

router.post("/", authentication, authorization, transactionPostValidation, create);
router.get("/list", authentication, authorization, paginationValidation, list);
router.get(
  "/total",
  authentication,
  authorization,
  totalTransaction,
);
router.get(
  "/:transactionId",
  authentication,
  authorization,
  idValidation,
  getTransactionByID,
);

module.exports = router;
