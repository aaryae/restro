const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  transferPostValidation,
} = require("../../validations/transfer-validation");

const { create, list } = require("../controllers/transfer-controller");

router.post("/", authentication, authorization, transferPostValidation, create);

router.get("/list", authentication, authorization, list);

module.exports = router;
