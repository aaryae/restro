const router = require("express").Router();
const { create, getById, update } = require("../controllers/smtp-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

const {
  smtpPostValidation,
  smtpPutValidation,
} = require("../../validations/smtp-validation");
router.post("/", authentication, authorization, smtpPostValidation, create);

router.get("/", authentication, authorization, getById);
router.put("/", authentication, authorization, smtpPutValidation, update);

module.exports = router;
