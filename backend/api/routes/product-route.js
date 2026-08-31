const router = require("express").Router();
const uploaderHelper = require("../../utils/multer");
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

// Configure multer for Excel file uploads
const uploadExcel = uploaderHelper.uploadXlsxDoc("excel", "single", "file");

const {
  create,
  list,
  getById,
  update,
  deleteProduct,
  updateByOrder,
  importFromExcel,
  topSelling,
} = require("../controllers/product-controller");

router.post("/", authentication, authorization, productPostValidation, create);
// Keep before "/:id" handlers so the literal path always wins.
router.post(
  "/import",
  authentication,
  authorization,
  uploadExcel,
  importFromExcel,
);
router.get("/list", authentication, paginationValidation, list);
router.get("/top-selling", authentication, topSelling);
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
  productPutValidation,
  update,
);

router.delete(
  "/:id",
  authentication,
  authorization,
  idValidation,
  deleteProduct,
);

module.exports = router;
