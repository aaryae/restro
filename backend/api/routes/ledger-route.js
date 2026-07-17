const router = require("express").Router();
const { authentication } = require("../../middlewares/auth-middleware");
const { getLedgerList } = require("../controllers/ledger-controller");

// Auth only (like trash/recently-deleted). Menu visibility is gated in Settings.
router.get("/list", authentication, getLedgerList);

module.exports = router;
