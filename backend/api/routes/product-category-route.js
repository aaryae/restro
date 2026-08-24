const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");
const {
  productCategoryPostValidation,
  productCategoryPutValidation,
} = require("../../validations/product-category-validation");
const { orderPutValidation } = require("../../validations/product-validation");
const {
  create,
  list,
  getById,
  update,
  deleteProductCategory,
  updateByOrder,
} = require("../controllers/product-category-controller");

const router = require("express").Router();

router.post(
  "/",
  authentication,
  authorization,
  productCategoryPostValidation,
  create,
);
router.get("/list", authentication, paginationValidation, list);
router.get("/:id", authentication, idValidation, getById);
router.put(
  "/update-order",
  authentication,
  authorization,
  orderPutValidation,
  updateByOrder,
);
router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  productCategoryPutValidation,
  update,
);

router.delete(
  "/:id",
  authentication,
  authorization,
  idValidation,
  deleteProductCategory,
);

module.exports = router;
