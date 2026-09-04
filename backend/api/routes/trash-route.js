const router = require("express").Router();
const { authentication } = require("../../middlewares/auth-middleware");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");
const {
  list,
  restore,
  permanentlyDelete,
} = require("../controllers/trash-controller");
const responseHelper = require("../../helpers/response-helper");
const httpStatus = require("http-status");
const messageConstant = require("../../constants/message-constant");

function requireSuperAdmin(req, res, next) {
  if (Number(req.user?.roleId) === 1) return next();
  return responseHelper.sendResponse(
    res,
    httpStatus.UNAUTHORIZED,
    false,
    null,
    null,
    messageConstant.EN.ACCESS_DENIED,
    null,
  );
}

// Soft-deleted item recovery is a privileged settings action.
router.get(
  "/list",
  authentication,
  requireSuperAdmin,
  paginationValidation,
  list,
);
router.post(
  "/restore/:id",
  authentication,
  requireSuperAdmin,
  idValidation,
  restore,
);
router.delete(
  "/:id",
  authentication,
  requireSuperAdmin,
  idValidation,
  permanentlyDelete,
);

module.exports = router;
