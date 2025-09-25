const router = require("express").Router();

const {
  createOrder,
  updateOrderItems,
  getTableActiveOrders,
  getOrderById,
  listOrders,
  updateOrderStatus,
  bulkServeOrderItems,
  updateOrderItemsStatus,
  checkoutOrder,
  listOrderItems,
  categorySalesSummary,
  productTopSales,
  moveOrderItems,
} = require("../controllers/order-controller");

const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  idValidation,
  paginationValidation,
} = require("../../validations/common-validation");
const {
  createOrderValidation,
  updateOrderItemsValidation,
  updateOrderStatusValidation,
  bulkServeOrderItemsValidation,
  updateOrderItemsStatusValidation,
  checkoutOrderValidation,
} = require("../../validations/order-validation");

const authenticateUser = require("../../middlewares/customer-auth-middleware");

router.get(
  "/list",
  authentication,
  authorization,
  // paginationValidation,
  listOrders,
);
router.get(
  "/category-sales-summary",
  authentication,
  authorization,
  categorySalesSummary,
);
router.get(
  "/product-top-sales",
  authentication,
  authorization,
  productTopSales,
);
// Customer/Staff routes
router.post(
  "/create",
  authentication,
  authorization,
  createOrderValidation,
  createOrder,
);
router.put(
  "/items/:orderId",
  authentication,
  authorization,
  // authenticateUser,
  // updateOrderItemsValidation,
  updateOrderItems,
);

// Bulk serve order items (waiter)
router.patch(
  "/items/bulk-serve",
  // authentication,
  // authorization,
  bulkServeOrderItemsValidation,
  bulkServeOrderItems,
);

// Department update order items status
router.patch(
  "/items/status",
  authentication,
  authorization,
  // updateOrderItemsStatusValidation,
  updateOrderItemsStatus,
);

// Checkout order (cashier)
router.post(
  "/checkout/:tableId",
  authentication,
  authorization,
  // idValidation,
  // checkoutOrderValidation,
  checkoutOrder,
);

// Admin routes

router.get("/active-orders/:id", getTableActiveOrders);
// add route in json
router.get(
  "/active-orders/:tableId",
  // authenticateUser,
  // authorization,
  getTableActiveOrders,
);
router.get(
  "/list/order-items",
  authentication,
  authorization,
  // paginationValidation,
  listOrderItems,
);

router.get(
  "/:id",
  authentication,
  //  authorization,
  idValidation,
  getOrderById,
);

router.post(
  "/move-order-items",
  authentication,
  authorization,
  // moveOrderItemsValidation, // TODO: Add validation
  moveOrderItems,
);

router.patch(
  "/status/:id",
  authentication,
  // authorization,
  idValidation,
  updateOrderStatusValidation,
  updateOrderStatus,
);

module.exports = router;
