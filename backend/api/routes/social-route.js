const router = require("express").Router();
const {
  createSocial,
  deleteSocial,
  getById,
  list,
  update,
} = require("../controllers/social-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  companySocialPostValidation,
  companySocialPutValidation,
} = require("../../validations/social");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");

router.post(
  "/",
  authentication,
  authorization,
  companySocialPostValidation,
  createSocial,
);
router.get("/list", paginationValidation, list);

router.get("/:id", authentication, idValidation, getById);

router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  companySocialPutValidation,
  update,
);

router.delete(
  "/:id",
  authentication,
  authorization,
  idValidation,
  deleteSocial,
);
module.exports = router;
