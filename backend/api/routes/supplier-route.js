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
  supplierPostValidation,
  supplierPutValidation,
} = require("../../validations/supplier-validation");

const {
  create,
  getList,
  getById,
  update,
  deleteById,
} = require("../controllers/supplier-controller");

router.post(
  "/create",
  authentication,
  authorization,
  supplierPostValidation,
  create,
);
router.get(
  "/list",
  authentication,
  authorization,
  paginationValidation,
  getList,
);
router.get("/:id", authentication, authorization, idValidation, getById);
router.put(
  "/update/:id",
  authentication,
  authorization,
  supplierPutValidation,
  update,
);

router.delete("/:id", authentication, authorization, idValidation, deleteById);
module.exports = router;
