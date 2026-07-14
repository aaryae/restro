const router = require("express").Router();
const {
  authLogin,
  authLogout,
  authCreateUser,
  authUpdateUser,
  authDeleteUser,
  authGetUser,
  resetPassword,
  authChangePassword,
  authListUser,
  authGetProfile,
  authIsActiveUser,
  updateProfile,
  getTotalOfManyModel,
} = require("../controllers/auth-controller");
const {
  loginValidation,
  createUserValidation,
  updateUserValidation,
  deleteUserValidation,
  passwordValidation,
  updatePublicUserValidation,
} = require("../../validations/auth-validation");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  idValidation,
  paginationValidation,
} = require("../../validations/common-validation");
const { isValidCaptcha } = require("../../middlewares/captcha-middleware");

router.post(
  "/create",
  authentication,
  authorization,
  createUserValidation,
  authCreateUser,
);

// this route is for getting the profile of the logged in user
router.get("/profile", authentication, authGetProfile);
router.get("/getTotalOfManyModel", authentication, getTotalOfManyModel);
router.put(
  "/update-profile",
  authentication,
  updatePublicUserValidation,
  updateProfile,
);
router.get(
  "/list",
  authentication,
  authorization,
  paginationValidation,
  authListUser,
);

router.put(
  "/change-password",
  authentication,
  passwordValidation,
  authChangePassword,
);
// router.put('/action-request')
router.put(
  "/reset-password/:id",
  authentication,
  authorization,
  idValidation,
  passwordValidation,
  resetPassword,
);

router.delete(
  "/:id",
  authentication,
  authorization,
  idValidation,
  deleteUserValidation,
  authDeleteUser,
);

router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  updateUserValidation,
  authUpdateUser,
);

router.patch(
  "/:id",
  authentication,
  authorization,
  idValidation,
  authIsActiveUser,
);

// this route is for getting user by id
router.get("/:id", authentication, authorization, idValidation, authGetUser);

router.post(
  "/login",
  loginValidation,
  // isValidCaptcha,
  authLogin,
);
router.post("/logout", authentication, authLogout);

module.exports = router;
