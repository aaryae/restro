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
  purchasePostValidation,
  purchasePutValidation,
  completePurchaseValidation,
  payPurchaseValidation,
  cancelPurchaseValidation,
  unpaidCreditsValidation,
} = require("../../validations/purchase-validtion");
const {
  create,
  list,
  getById,
  update,
  completePurchase,
  recordCreditPayment,
  cancelPurchase,
  getUnpaidCredits,
  deleteById,
  totalPurchase,
} = require("../controllers/purchase-controller");

router.post("/", authentication, authorization, purchasePostValidation, create);
router.get("/list", paginationValidation, list);
router.get(
  "/total-purchase",
  authentication,
  authorization,
  paginationValidation,
  totalPurchase,
);
router.get(
  "/unpaid-credits",
  paginationValidation,
  unpaidCreditsValidation,
  getUnpaidCredits,
);
router.get("/:id", idValidation, getById);
router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  purchasePutValidation,
  update,
);
router.put(
  "/:id/complete",
  authentication,
  authorization,
  idValidation,
  completePurchaseValidation,
  completePurchase,
);
router.put(
  "/:id/pay",
  authentication,
  authorization,
  idValidation,
  payPurchaseValidation,
  recordCreditPayment,
);
router.put(
  "/:id/cancel",
  authentication,
  authorization,
  idValidation,
  cancelPurchaseValidation,
  cancelPurchase,
);

router.delete("/:id", authentication, authorization, idValidation, deleteById);

module.exports = router;
