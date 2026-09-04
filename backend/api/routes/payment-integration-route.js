const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const { idValidation } = require("../../validations/common-validation");
const {
  createPaymentIntegrationValidation,
  updatePaymentIntegrationValidation,
} = require("../../validations/payment-integration-validation");
const {
  list,
  activeAccounts,
  getById,
  create,
  update,
  setActive,
  remove,
} = require("../controllers/payment-integration-controller");
const responseHelper = require("../../helpers/response-helper");
const httpStatus = require("http-status");
const messageConstant = require("../../constants/message-constant");

/** Bank/QR credential management is Super Admin only (not in RBAC menu yet). */
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

// Checkout needs this for any cashier with Order access.
router.get("/active-accounts", authentication, activeAccounts);

// Credential management
router.get("/", authentication, requireSuperAdmin, list);
router.get("/:id", authentication, requireSuperAdmin, idValidation, getById);
router.post(
  "/",
  authentication,
  requireSuperAdmin,
  createPaymentIntegrationValidation,
  create,
);
router.put(
  "/:id",
  authentication,
  requireSuperAdmin,
  idValidation,
  updatePaymentIntegrationValidation,
  update,
);
router.patch(
  "/:id/activate",
  authentication,
  requireSuperAdmin,
  idValidation,
  setActive,
);
router.delete(
  "/:id",
  authentication,
  requireSuperAdmin,
  idValidation,
  remove,
);

module.exports = router;
