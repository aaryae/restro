const router = require("express").Router();
const {
  create,
  deleteTemplate,
  getById,
  list,
  update,
} = require("../controllers/email-template-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  emailTemplatePostValidation,
  emailTemplatePutValidation,
} = require("../../validations/email-template-validation");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");

router.post(
  "/",
  authentication,
  authorization,
  emailTemplatePostValidation,
  create,
);
router.get("/list", paginationValidation, authentication, authorization, list);

router.get("/:id", authentication, authorization, idValidation, getById);

router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  emailTemplatePutValidation,
  update,
);

router.delete(
  "/:id",
  authentication,
  authorization,
  idValidation,
  deleteTemplate,
);
module.exports = router;
