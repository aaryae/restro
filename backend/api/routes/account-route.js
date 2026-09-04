const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  accountPostValidation,
} = require("../../validations/account_validation");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");

const {
  create,
  list,
  getAccountByID,
  updateAccount,
  changeStatus,
  changeDefaultAccount,
  totalAndBalances,
} = require("../controllers/account-controller");
const {
  checkAccountPermission,
} = require("../../middlewares/accountPermission");

router.post("/", authentication, authorization, accountPostValidation, create);
router.get("/list", authentication, authorization, paginationValidation, list);
router.get(
  "/total-and-balances",
  authentication,
  authorization,
  paginationValidation,
  totalAndBalances,
);
router.get(
  "/:accountId",
  authentication,
  authorization,
  idValidation,
  getAccountByID,
);
router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  // add specific validation later if needed
  updateAccount,
);
router.patch(
  "/:id/status",
  authentication,
  authorization,
  idValidation,
  changeStatus,
);
router.patch(
  "/:id/default",
  authentication,
  authorization,
  idValidation,
  changeDefaultAccount,
);

router.delete(
  "/:id",
  authentication,
  authorization,
  idValidation,
  require("../controllers/account-controller").deleteAccount,
);

module.exports = router;
