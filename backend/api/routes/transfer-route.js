const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  transferPostValidation,
} = require("../../validations/transfer-validation");

const { create } = require("../controllers/transfer-controller");

router.post("/", authentication, transferPostValidation, create);

module.exports = router;
