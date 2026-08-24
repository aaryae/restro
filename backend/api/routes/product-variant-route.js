const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");

const {
  productVariantPostValidation,
  productVariantPutValidation,
} = require("../../validations/product-variant-validation");

const {
  create,
  list,
  getById,
  update,
  deleteProductVariant,
} = require("../controllers/product-variant-controller");

const router = require("express").Router();

router.post(
  "/",
  authentication,
  authorization,
  productVariantPostValidation,
  create,
);

router.get("/list", authentication, paginationValidation, list);

router.get("/:id", authentication, idValidation, getById);

router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  productVariantPutValidation,
  update,
);

router.delete(
  "/:id",
  authentication,
  authorization,
  idValidation,
  deleteProductVariant,
);

module.exports = router;
