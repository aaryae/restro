const router = require("express").Router();
const { authentication } = require("../../middlewares/auth-middleware");
const {
  overview,
  dailySales,
} = require("../controllers/dashboard-controller");

router.get("/overview", authentication, overview);
router.get("/daily-sales", authentication, dailySales);

module.exports = router;
