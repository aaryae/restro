const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const { idValidation } = require("../../validations/common-validation");
const {
  listValidation,
  getByIdValidation,
  createValidation,
  updateValidation,
  deleteValidation,
  getByUserIdValidation,
} = require("../../validations/account-permission-validation");

const {
  list,
  getById,
  create,
  update,
  remove,
  getByUserId,
} = require("../controllers/account-permission-controller");

// List all account permissions with pagination and filtering
router.get("/list", authentication, authorization, list);

// Get account permission by ID
router.get("/:id", authentication, authorization, idValidation, getById);

// Create new account permission
router.post("/", authentication, authorization, createValidation, create);

// Update account permission
router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  updateValidation,
  update,
);

// Delete account permission
router.delete("/:id", authentication, authorization, idValidation, remove);

// Get permissions by user ID
router.get(
  "/user/:userId",
  authentication,
  authorization,
  idValidation,
  getByUserId,
);

module.exports = router;
