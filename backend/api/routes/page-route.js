const router = require("express").Router();
const {
  create,
  deleteOne,
  getById,
  list,
  update,
} = require("../controllers/page-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

const {
  pagePostValidation,
  pagePutValidation,
} = require("../../validations/page-validation");
const { idValidation } = require("../../validations/common-validation");

router.post(
  "/",
  authentication,
  authorization,
  pagePostValidation,
  create,
);
router.get(
  "/list",
  authentication,
  authorization,
  list,
);
router.get(
  "/:id",
  authentication,
  authorization,
  getById,
);
router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  pagePutValidation,
  update,
);

router.delete(
  "/:id",
  authentication,
  authorization,
  deleteOne,
);
module.exports = router;
