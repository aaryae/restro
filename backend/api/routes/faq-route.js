const router = require("express").Router();
const {
  create,
  deleteFaq,
  getById,
  list,
  update,
  updateByOrder,
} = require("../controllers/faq-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  faqPostValidation,
  faqPutValidation,
} = require("../../validations/faq-validation");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");

router.post("/", authentication, authorization, faqPostValidation, create);
router.get("/list", paginationValidation, list);

router.get("/:id", idValidation, getById);

router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  faqPutValidation,
  update,
);

router.put("/", authentication, authorization, updateByOrder);

router.delete("/:id", authentication, authorization, deleteFaq);
module.exports = router;
