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
  productPostValidation,
  productPutValidation,
  orderPutValidation,
} = require("../../validations/product-validation");

const { list } = require("../controllers/revenue-controller");

// router.post("/", authentication, authorization, productPostValidation, create);
router.get("/list", paginationValidation, list);
// router.get("/:id", idValidation, getById);
// router.put(
//   "/update-order",
//   authentication,
//   authorization,
//   orderPutValidation,
//   updateByOrder,
// );
// router.put(
//   "/:id",
//   authentication,
//   authorization,
//   idValidation,
//   productPutValidation,
//   update,
// );

// router.delete(
//   "/:id",
//   authentication,
//   authorization,
//   idValidation,
//   deleteProduct,
// );

module.exports = router;
