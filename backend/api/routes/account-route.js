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
  changeStatus,
  changeDefaultAccount,
} = require("../controllers/account-controller");

router.post("/", authentication, authorization, accountPostValidation, create);
router.get("/list", authentication, authorization, paginationValidation, list);
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

module.exports = router;
