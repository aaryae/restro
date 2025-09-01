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
  revenuePostValidation,
} = require("../../validations/revenue-validation");

const { list, create } = require("../controllers/revenue-controller");

router.post("/", authentication, revenuePostValidation, create);
router.get("/list", authentication, paginationValidation, list);
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
