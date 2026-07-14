const router = require("express").Router();
const {
  authentication,
} = require("../../middlewares/auth-middleware");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");
const {
  list,
  restore,
  permanentlyDelete,
} = require("../controllers/trash-controller");

router.get("/list", authentication, paginationValidation, list);
router.post("/restore/:id", authentication, idValidation, restore);
router.delete("/:id", authentication, idValidation, permanentlyDelete);

module.exports = router;
