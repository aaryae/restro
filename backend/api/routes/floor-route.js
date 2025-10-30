const router = require("express").Router();
const {
  create,
  list,
  getById,
  updateById,
  deleteById,
  updateStatusById,
} = require("../controllers/floor-controller");
const {
  createFloorValidation,
  updateFloorValidation,
  updateFloorStatusValidation,
} = require("../../validations/floor-validation");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

// Admin routes
router.post("/", authentication, authorization, createFloorValidation, create);

router.get("/list", authentication, authorization, paginationValidation, list);

router.get("/:id", authentication, authorization, idValidation, getById);

router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  updateFloorValidation,
  updateById,
);

router.patch(
  "/:id",
  authentication,
  authorization,
  idValidation,
  updateFloorStatusValidation,
  updateStatusById,
);

router.delete("/:id", authentication, authorization, idValidation, deleteById);

module.exports = router;
