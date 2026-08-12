"use strict";

const router = require("express").Router();
const {
  register,
  login,
  googleAuth,
  me,
  checkSlug,
  suggestSlug,
  createRestaurant,
} = require("../controllers/trial-controller");
const { trialAuthentication } = require("../../middlewares/trial-auth-middleware");
const { loginRateLimiter } = require("../../utils/loginRateLimit");

// Public
router.post("/register", loginRateLimiter, register);
router.post("/login", loginRateLimiter, login);
router.post("/google", googleAuth);
router.get("/slug-available", checkSlug);
router.get("/suggest-slug", suggestSlug);

// Authenticated trial account
router.get("/me", trialAuthentication, me);
router.post("/restaurants", trialAuthentication, createRestaurant);

module.exports = router;
