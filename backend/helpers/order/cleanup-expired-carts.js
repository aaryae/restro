const cron = require("node-cron");
const { releaseExpiredStock } = require("./release-expired-stock");
const { withTransaction } = require("./transaction");

// const cleanupExpiredCarts = cron.schedule("*/10 * * * *", () =>
//   withTransaction(async (t) => {
//     await releaseExpiredStock(t);
//     console.log("Expired carts’ stock released");
//   }),
// );
// cleanupExpiredCarts.start();
// module.exports = { cleanupExpiredCarts };
