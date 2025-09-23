const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");
const {
  expensePostValidation,
  expensePutValidation,
  payExpenseValidation,
  cancelExpenseValidation,
} = require("../../validations/expense_validation");
const {
  create,
  list,
  getById,
  update,
  recordCreditPayment,
  cancelExpense,
  getUnpaidCredits,
  totalExpense,
  categorySummary,
} = require("../controllers/expense-controller");

router.post("/", authentication, authorization, expensePostValidation, create);
router.get("/list", paginationValidation, list);
router.get(
  "/total-expense",
  authentication,
  authorization,
  paginationValidation,
  totalExpense,
);
router.get(
  "/category-summary",
  authentication,
  authorization,
  paginationValidation,
  categorySummary,
);
router.get("/:id", idValidation, getById);
router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  expensePutValidation,
  update,
);
router.put(
  "/:id/pay",
  authentication,
  authorization,
  idValidation,
  payExpenseValidation,
  recordCreditPayment,
);
router.delete(
  "/:id",
  authentication,
  authorization,
  idValidation,
  cancelExpenseValidation,
  cancelExpense,
);
router.get("/unpaid-credits", paginationValidation, getUnpaidCredits);

module.exports = router;
