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
  revenuePutValidation,
} = require("../../validations/revenue-validation");

const { update, deleteRevenue } = require("../controllers/revenue-controller");

const {
  create,
  list,
  getAccountByID,
  updateAccount,
  changeStatus,
  changeDefaultAccount,
} = require("../controllers/account-controller");

router.post("/", authentication, accountPostValidation, create);
router.get("/list", authentication, paginationValidation, list);
router.get("/:id", authentication, idValidation, getAccountByID);
router.put(
  "/:id",
  authentication,
  // authorization,
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

// router.delete(
//   "/:id",
//   authentication,
//   // authorization,
//   idValidation,
//   require("../controllers/account-controller").deleteAccount,
// );

module.exports = router;
