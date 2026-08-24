const router = require("express").Router();
const {
  // deleteNotification,
  getById,
  list,
  updateReadStatus,
} = require("../controllers/notification-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

const {
  idValidation,
  paginationValidation,
} = require("../../validations/common-validation");

router.get("/list", authentication, paginationValidation, list);

router.get("/:id", authentication, idValidation, getById);

router.patch("/:id", authentication, idValidation, updateReadStatus);

// router.delete(
//   "/:id",
//   idValidation,
//   authentication,
//   authorization,
//   deleteNotification,
// );
module.exports = router;
