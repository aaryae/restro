const router = require("express").Router();

const { list, updateById } = require("../controllers/kot-controller");

const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const { kotPutValidation } = require("../../validations/kot-validation");

// Admin routes

router.get("/list", authentication, authorization, paginationValidation, list);

router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  kotPutValidation,
  updateById,
);

module.exports = router;
