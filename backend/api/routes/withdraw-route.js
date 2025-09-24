const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  withdrawPostValidation,
} = require("../../validations/withdraw_validation");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");

const {
  create,
  list,
  getWithdrawByID,
  updateWithdraw,
} = require("../controllers/withdraw-controller");
const {
  checkAccountPermission,
} = require("../../middlewares/accountPermission");

router.post("/", authentication, withdrawPostValidation, create);
router.get("/list", authentication, authorization, paginationValidation, list);
router.get(
  "/:withdrawId",
  authentication,
  idValidation,
  getWithdrawByID,
);
router.put(
  "/:id",
  authentication,
  idValidation,
  updateWithdraw,
);

module.exports = router;
