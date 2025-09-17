const router = require("express").Router();

const { list } = require("../controllers/kot-controller");

const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

// Admin routes

router.get(
  "/list",
  authentication,
  // authorization,
  paginationValidation,
  list,
);

// router.get("/:id", authentication, authorization, idValidation, getById);

// router.put(
//   "/:id",
//   authentication,
//   authorization,
//   idValidation,
//   updateFloorValidation,
//   updateById,
// );

// router.delete("/:id", authentication, authorization, idValidation, deleteById);

module.exports = router;
