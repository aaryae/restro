const router = require("express").Router();
const { authentication } = require("../../middlewares/auth-middleware");
const {
  requireCheckoutPermission,
} = require("../../middlewares/payment-auth-middleware");
const { idValidation } = require("../../validations/common-validation");
const { initiateQrValidation } = require("../../validations/payment-validation");
const {
  initiateQr,
  getStatus,
  cancel,
} = require("../controllers/payment-controller");

router.post(
  "/qr/initiate",
  authentication,
  requireCheckoutPermission,
  initiateQrValidation,
  initiateQr,
);
router.get(
  "/qr/:id/status",
  authentication,
  requireCheckoutPermission,
  idValidation,
  getStatus,
);
router.post(
  "/qr/:id/cancel",
  authentication,
  requireCheckoutPermission,
  idValidation,
  cancel,
);

module.exports = router;
