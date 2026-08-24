const router = require("express").Router();
const {
  create,
  deleteOne,
  getBySlug,
  getById,
  update,
  list,
  deleteBanner,
} = require("../controllers/banner-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  paginationValidation,
  idValidation,
  slugValidation,
} = require("../../validations/common-validation");
const {
  bannerPutValidation,
  bannerPostValidation,
} = require("../../validations/banner-validation");

// router.post("/", authentication, authorization, bannerPostValidation, create);
router.get("/list", paginationValidation, list);

router.get("/:slug", slugValidation, getBySlug);
// router.get("/:id", getById);

router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  bannerPutValidation,
  update,
);

// router.delete("/:id", authentication, authorization, deleteBanner);
module.exports = router;
