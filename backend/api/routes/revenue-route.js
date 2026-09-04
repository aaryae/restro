const router = require("express").Router();
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");
const {
  revenuePostValidation,
  revenuePutValidation,
} = require("../../validations/revenue-validation");

const {
  list,
  create,
  update,
  deleteRevenue,
  getById,
  groupedList,
  totalRevenue,
  revenueByAccount,
  todayRevenue,
} = require("../controllers/revenue-controller");

router.post("/", authentication, authorization, revenuePostValidation, create);
router.get("/list", authentication, authorization, paginationValidation, list);
router.get(
  "/grouped-list",
  authentication,
  authorization,
  paginationValidation,
  groupedList,
);
router.get("/by-account", authentication, authorization, revenueByAccount);
router.get("/revenue-today", authentication, authorization, todayRevenue);
router.get(
  "/total-revenue",
  authentication,
  authorization,
  paginationValidation,
  totalRevenue,
);
router.get("/:id", authentication, authorization, idValidation, getById);
router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  revenuePutValidation,
  update,
);
router.delete(
  "/:id",
  authentication,
  authorization,
  idValidation,
  deleteRevenue,
);
// router.get("/:id", idValidation, getById);
// router.put(
//   "/update-order",
//   authentication,
//   authorization,
//   orderPutValidation,
//   updateByOrder,
// );

// router.delete(
//   "/:id",
//   authentication,
//   authorization,
//   idValidation,
//   deleteProduct,
// );

module.exports = router;
