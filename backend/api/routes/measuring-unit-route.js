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
  postValidation,
  putValidation,
} = require("../../validations/measuring-unit-validation");
const {
  create,
  list,
  getById,
  update,
  deleteById,
} = require("../controllers/measuring-unit-controller");

router.post("/", authentication, authorization, postValidation, create);
router.get("/list", authentication, authorization, paginationValidation, list);
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
