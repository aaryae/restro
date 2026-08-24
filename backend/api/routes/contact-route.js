const router = require("express").Router();
const {
  create,
  deleteOne,
  getById,
  list,
} = require("../controllers/contact-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");
const {
  contactPostValidation,
} = require("../../validations/contact-validation");

router.post("/", contactPostValidation, create);
router.get("/list", authentication, authorization, paginationValidation, list);
router.get("/:id", authentication, authorization, getById);

router.delete("/:id", idValidation, authentication, authorization, deleteOne);
module.exports = router;
