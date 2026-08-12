const router = require("express").Router();
const {
  getAccessModules,
  getAccessModule,
  getRoleMenuActions,
  getRoleAllowableActions,
  getRoleActions,
  getAllRoleMenuAction,
} = require("../controllers/access-module-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const { paginationValidation } = require("../../validations/common-validation");

router.get(
  "/role-menu-action/list",
  authentication,
  authorization,
  getAllRoleMenuAction,
);

router.get(
  "/role-menu-action/:id",
  authentication,
  authorization,
  getRoleMenuActions,
);

router.get(
  "/allowable-actions/:id",
  authentication,
  authorization,
  getRoleAllowableActions,
);

router.get("/role-actions", authentication, authorization, getRoleActions);

router.get(
  "/list",
  authentication,
  authorization,
  paginationValidation,
  getAccessModules,
);

router.get(
  "/",
  authentication,
  authorization,
  paginationValidation,
  getAccessModules,
);

router.get("/:id", authentication, authorization, getAccessModule);

module.exports = router;
