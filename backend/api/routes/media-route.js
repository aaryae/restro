const router = require("express").Router();
const {
  changeName,
  deleteMedia,
  getById,
  list,
  uploadMedia,
  bulkDelete,
} = require("../controllers/media-controller");
const uploaderHelper = require("../../utils/multer");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

// const {

//   } = require("../../validations/media-validation");

const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");
const {
  mediaBulkDeleteValidation,
  changeNameValidation,
} = require("../../validations/media-validation");

const upload = uploaderHelper.uploadFiles(
  "resources",
  "single",
  "image",
  false,
);

router.post("/", authentication, authorization, upload, uploadMedia);
router.post(
  "/customer-upload",
  upload,
  uploadMedia,
);
router.get("/list", authentication, paginationValidation, list);
router.get("/:id", authentication, idValidation, getById);
router.put(
  "/change-name/:id",
  authentication,
  authorization,
  changeNameValidation,
  changeName,
);

router.delete(
  "/bulk-delete",
  authentication,
  authorization,
  mediaBulkDeleteValidation,
  bulkDelete,
);
router.delete("/:id", authentication, authorization, idValidation, deleteMedia);

module.exports = router;
