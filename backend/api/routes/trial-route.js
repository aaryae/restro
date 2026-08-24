"use strict";

const router = require("express").Router();
const {
  register,
  login,
  verifyOtp,
  resendOtp,
  checkUsername,
  googleAuth,
  me,
  checkSlug,
  suggestSlug,
  createRestaurant,
  posBootstrap,
} = require("../controllers/trial-controller");
const { trialAuthentication } = require("../../middlewares/trial-auth-middleware");
const {
  loginRateLimiter,
  provisionRateLimiter,
} = require("../../utils/loginRateLimit");

// Public
router.post("/register", loginRateLimiter, register);
router.post("/login", loginRateLimiter, login);
router.post("/verify-otp", loginRateLimiter, verifyOtp);
router.post("/resend-otp", loginRateLimiter, resendOtp);
router.get("/username-available", checkUsername);
router.post("/google", provisionRateLimiter, googleAuth);
router.get("/slug-available", checkSlug);
router.get("/suggest-slug", suggestSlug);

// Authenticated trial account
router.get("/me", trialAuthentication, me);
router.get("/pos-bootstrap", trialAuthentication, posBootstrap);
router.post("/restaurants", trialAuthentication, provisionRateLimiter, createRestaurant);

module.exports = router;
