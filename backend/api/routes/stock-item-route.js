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
  postValidation,
  putValidation,
  adjustValidation,
} = require("../../validations/stock-item-validation");
const {
  create,
  list,
  getById,
  update,
  adjust,
  summary,
  deleteById,
  importFromExcel,
} = require("../controllers/stock-item-controller");

const uploadExcel = uploaderHelper.uploadXlsxDoc("excel", "single", "file");

router.post("/", authentication, authorization, postValidation, create);
router.post(
  "/import",
  authentication,
  authorization,
  uploadExcel,
  importFromExcel,
);
router.get("/list", authentication, authorization, paginationValidation, list);
router.get("/summary", authentication, authorization, summary);
router.post(
  "/:id/adjust",
  authentication,
  authorization,
  idValidation,
  adjustValidation,
  adjust,
);
router.get("/:id", authentication, authorization, idValidation, getById);
router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  putValidation,
  update,
);
router.delete("/:id", authentication, authorization, idValidation, deleteById);

module.exports = router;
