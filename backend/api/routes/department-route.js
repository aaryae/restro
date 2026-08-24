const router = require("express").Router();
const {
  create,
  list,
  getById,
  updateById,
  deleteById,
} = require("../controllers/department-controller");
const {
  createDepartmentValidation,
  updateDepartmentValidation,
} = require("../../validations/department-validation");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

// Admin routes
router.post(
  "/",
  authentication,
  authorization,
  createDepartmentValidation,
  create,
);

router.get("/list", authentication, authorization, paginationValidation, list);

router.get("/:id", authentication, authorization, idValidation, getById);

router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  updateDepartmentValidation,
  updateById,
);

router.delete("/:id", authentication, authorization, idValidation, deleteById);

module.exports = router;
