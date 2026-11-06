"use strict";

const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { getMenu, getBill, callBill } = require("../controllers/guest-controller");

const guestReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    success: false,
    msg: "Too many menu requests. Please try again in a minute.",
  },
  validate: false,
  keyGenerator: (req) =>
    `${req.tenant?.slug || "none"}:${req.ip || req.deviceFingerprint || "unknown"}`,
});

const guestWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    msg: "Too many bill requests. Please try again shortly.",
  },
  validate: false,
  keyGenerator: (req) =>
    `${req.tenant?.slug || "none"}:${req.ip || req.deviceFingerprint || "unknown"}`,
});

router.get("/menu", guestReadLimiter, getMenu);
router.get("/bill", guestReadLimiter, getBill);
router.post("/call-bill", guestWriteLimiter, callBill);

module.exports = router;
