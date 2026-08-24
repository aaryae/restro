const router = require("express").Router();
const {
  createRoles,
  getRoles,
  getRoleSingle,
  editRoleSingle,
  deleteRoleSingle,
} = require("../controllers/roles-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  rolesPostValidation,
  rolesDetailViewValidation,
  rolesPutValidation,
} = require("../../validations/roles-validation");
const { paginationValidation } = require("../../validations/common-validation");

router.post(
  "/",
  authentication,
  authorization,
  rolesPostValidation,
  createRoles,
);

router.get("/list", paginationValidation, authentication, getRoles);

router.get("/:id", authentication, rolesDetailViewValidation, getRoleSingle);

router.put(
  "/:id",
  authentication,
  authorization,
  rolesDetailViewValidation,
  rolesPutValidation,
  editRoleSingle,
);

//permanent delete
router.delete(
  "/:id",
  authentication,
  authorization,
  rolesDetailViewValidation,
  deleteRoleSingle,
);

module.exports = router;
