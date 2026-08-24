const router = require("express").Router();
const {
  create,
  list,
  getById,
  updateTableStatus,
  deleteById,
  moveOrders,
} = require("../controllers/table-controller");
const {
  createTableValidation,
  updateTableValidation,
} = require("../../validations/table-validation");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

// Admin routes
router.post("/", authentication, authorization, createTableValidation, create);

router.get("/list", authentication, authorization, paginationValidation, list);

router.post("/move-orders", authentication, authorization, moveOrders);

router.get("/:id", authentication, authorization, idValidation, getById);

router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  updateTableValidation,
  updateTableStatus,
);

router.delete("/:id", authentication, authorization, idValidation, deleteById);

module.exports = router;
