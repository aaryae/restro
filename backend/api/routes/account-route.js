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

const { create, list } = require("../controllers/account-controller");

router.post("/", authentication, accountPostValidation, create);
router.get("/list", authentication, paginationValidation, list);
router.put(
  "/:id",
  authentication,
  // authorization,
  idValidation,
  revenuePutValidation,
  update,
);
router.delete(
  "/:id",
  authentication,
  authorization,
  idValidation,
  deleteRevenue,
);

module.exports = router;
