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
  expenseCategoryPostValidation,
  expenseCategoryPutValidation,
} = require("../../validations/expense-category-validation");
const {
  create,
  list,
  getById,
  update,
  deleteById,
} = require("../controllers/expense-category-controller");

router.post(
  "/",
  authentication,
  authorization,
  expenseCategoryPostValidation,
  create,
);
router.get("/list", paginationValidation, list);
router.get("/:id", idValidation, getById);
router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  expenseCategoryPutValidation,
  update,
);
router.delete("/:id", authentication, authorization, idValidation, deleteById);

module.exports = router;
