const router = require("express").Router();
const {
  create,
  deleteSeo,
  getById,
  list,
  update,
} = require("../controllers/seo-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  seoPostValidation,
  seoPutValidation,
} = require("../../validations/seo-validation");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");

router.post("/", authentication, authorization, seoPostValidation, create);
router.get("/list", paginationValidation, list);

router.get("/:id", idValidation, getById);

router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  seoPutValidation,
  update,
);

router.delete("/:id", authentication, authorization, deleteSeo);
module.exports = router;
