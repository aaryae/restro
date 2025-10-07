const express = require("express");
const router = express.Router();
const addonController = require("../controllers/addon-controller");
const { authentication } = require("../../middlewares/auth-middleware");
const { addonPostValidation, addonPutValidation } = require("../../validations/addon-validation");

// Public routes with authentication
router.get("/", authentication, addonController.list);
router.get("/:id", authentication, addonController.getById);

// Protected routes (require authentication and appropriate permissions)
router.post(
  "/",
  authentication,
  addonPostValidation,
  addonController.create
);

router.put(
  "/:id",
  authentication,
  addonPutValidation,
  addonController.update
);

router.delete(
  "/:id",
  authentication,
  addonController.deleteAddon
);

router.get(
  "/unused/list",
  authentication,
  addonController.getUnusedAddons
);

module.exports = router;
