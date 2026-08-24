const router = require("express").Router();
const { authentication } = require("../../middlewares/auth-middleware");
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

router.get("/", authentication, list);
router.get("/active-accounts", authentication, activeAccounts);
router.get("/:id", authentication, idValidation, getById);
router.post("/", authentication, createPaymentIntegrationValidation, create);
router.put("/:id", authentication, idValidation, updatePaymentIntegrationValidation, update);
router.patch("/:id/activate", authentication, idValidation, setActive);
router.delete("/:id", authentication, idValidation, remove);

module.exports = router;
