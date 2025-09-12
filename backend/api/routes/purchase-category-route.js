const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");
const {
  categoryPostValidation,
  categoryPutValidation,
  categoryDeleteValidation,
} = require("../../validations/purchase_category-validation");
const {
  create,
  list,
  getById,
  update,
  deleteCategory,
} = require("../controllers/purchase-category-controller");

router.post("/", authentication, authorization, categoryPostValidation, create);
router.get("/list", paginationValidation, list);
router.get("/:id", idValidation, getById);
router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  categoryPutValidation,
  update,
);
router.delete(
  "/:id",
  authentication,
  authorization,
  idValidation,
  categoryDeleteValidation,
  deleteCategory,
);

module.exports = router;
