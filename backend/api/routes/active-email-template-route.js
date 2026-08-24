const router = require("express").Router();
const {
  create,
  getById,
  list,
} = require("../controllers/active-email-template-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  idValidation,
  paginationValidation,
} = require("../../validations/common-validation");
const {
  activeEmailTemplatePostValidation,
  activeEmailTemplatePutValidation,
} = require("../../validations/active-email-template-validation");
router.post(
  "/",
  authentication,
  authorization,
  activeEmailTemplatePostValidation,
  create,
);
router.get("/list", authentication, authorization, paginationValidation, list);

router.get("/:id", authentication, authorization, idValidation, getById);

module.exports = router;
