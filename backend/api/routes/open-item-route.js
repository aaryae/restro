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
  openItemPostValidation,
  openItemPutValidation,
} = require("../../validations/open-item-validation");

const {
  create,
  list,
  getById,
  update,
  deleteOpenItem,
} = require("../controllers/open-item-controller");

router.post("/", authentication, authorization, openItemPostValidation, create);
router.get("/list", authentication, paginationValidation, list);
router.get("/:id", authentication, idValidation, getById);
router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  openItemPutValidation,
  update,
);

router.delete(
  "/:id",
  authentication,
  authorization,
  idValidation,
  deleteOpenItem,
);

module.exports = router;
