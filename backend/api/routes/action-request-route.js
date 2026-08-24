const router = require("express").Router();
const {
  actionRequest,
  getAll,
  getRelatedRequest,
} = require("../controllers/action-request-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  actionRequestPostValidation,
} = require("../../validations/action-request-validation");

router.get("/list", authentication, authorization, getAll);
router.get("/getRelatedRequest", authentication, getRelatedRequest);
router.put(
  "/:id",
  actionRequestPostValidation,
  authentication,
  authorization,
  actionRequest,
);

module.exports = router;
