// This route is for admin to handle customer details
const {
  idValidation,
  paginationValidation,
} = require("../../validations/common-validation");
const {
  createValidation,
  updateValidation,
} = require("../../validations/customer-auth-validation");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

const router = require("express").Router();
const {
  create,
  deleteData,
  getById,
  list,
  update,
} = require("../controllers/customer-controller");

router.post(
  "/create",
  // authentication,
  // authorization,
  // createValidation,
  create,
);

router.get(
  "/list",
  // authentication,
  // authorization,
  paginationValidation,
  list,
);
router.get(
  "/:id",
  // authentication,
  // authorization,
  idValidation,
  getById,
);

router.put(
  "/:id",
  // authentication,
  // authorization,
  idValidation,
  updateValidation,
  update,
);
router.delete(
  "/:id",
  // authentication,
  // authorization,
  idValidation,
  deleteData,
);

module.exports = router;
