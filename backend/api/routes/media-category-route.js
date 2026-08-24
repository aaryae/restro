const router = require("express").Router();
const {
  createMediaCategory,
  deleteMediaCategory,
  getById,
  list,
  update,
} = require("../controllers/media-category-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  mediaCategoryPostValidation,
  mediaCategoryPutValidation,
} = require("../../validations/media-category-validation");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");

router.post(
  "/",
  authentication,
  authorization,
  mediaCategoryPostValidation,
  createMediaCategory,
);
router.get("/list", paginationValidation, list);

router.get("/:id", authentication, idValidation, getById);

router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  mediaCategoryPutValidation,
  update,
);

router.delete("/:id", authentication, authorization, deleteMediaCategory);
module.exports = router;
