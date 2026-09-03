"use strict";

const router = require("express").Router();
const {
  login,
  me,
  updateMe,
  changeMyPassword,
  uploadMyAvatar,
  stats,
  statsTrends,
  listCafes,
  getCafe,
  createCafe,
  activateCafe,
  suspendCafe,
  extendTrial,
  impersonateCafe,
  listJobs,
  listAuditLogs,
  listPlatformUsers,
  createPlatformUser,
  updatePlatformUser,
  deletePlatformUser,
  getSmtp,
  upsertSmtp,
  listCafeEmailTemplates,
  upsertCafeEmailTemplate,
  resetCafeEmailTemplate,
} = require("../controllers/platform-controller");
const {
  platformAuthentication,
  requirePlatformPermission,
} = require("../../middlewares/platform-auth-middleware");
const {
  loginRateLimiter,
  provisionRateLimiter,
} = require("../../utils/loginRateLimit");
const uploaderHelper = require("../../utils/multer");

const uploadAvatar = uploaderHelper.uploadFiles(
  "resources",
  "single",
  "image",
  false,
);

router.post("/login", loginRateLimiter, login);

router.get("/me", platformAuthentication, me);
router.patch("/me", platformAuthentication, updateMe);
router.put("/me/password", platformAuthentication, changeMyPassword);
router.post(
  "/me/avatar",
  platformAuthentication,
  uploadAvatar,
  uploadMyAvatar,
);
router.get(
  "/stats",
  platformAuthentication,
  requirePlatformPermission("dashboard.view"),
  stats,
);
router.get(
  "/stats/trends",
  platformAuthentication,
  requirePlatformPermission("dashboard.view"),
  statsTrends,
);

router.get(
  "/cafes",
  platformAuthentication,
  requirePlatformPermission("cafes.section"),
  listCafes,
);
router.post(
  "/cafes",
  platformAuthentication,
  requirePlatformPermission("cafes.create"),
  provisionRateLimiter,
  createCafe,
);
router.get(
  "/cafes/:id",
  platformAuthentication,
  requirePlatformPermission("cafes.view"),
  getCafe,
);
router.post(
  "/cafes/:id/activate",
  platformAuthentication,
  requirePlatformPermission("cafes.activate"),
  activateCafe,
);
router.post(
  "/cafes/:id/suspend",
  platformAuthentication,
  requirePlatformPermission("cafes.suspend"),
  suspendCafe,
);
router.post(
  "/cafes/:id/extend-trial",
  platformAuthentication,
  requirePlatformPermission("cafes.extend"),
  extendTrial,
);
router.post(
  "/cafes/:id/impersonate",
  platformAuthentication,
  requirePlatformPermission("cafes.impersonate"),
  impersonateCafe,
);

router.get(
  "/jobs",
  platformAuthentication,
  requirePlatformPermission("cafes.view"),
  listJobs,
);
router.get(
  "/audit-logs",
  platformAuthentication,
  requirePlatformPermission("audit.read"),
  listAuditLogs,
);

router.get(
  "/users",
  platformAuthentication,
  requirePlatformPermission("users.manage"),
  listPlatformUsers,
);
router.post(
  "/users",
  platformAuthentication,
  requirePlatformPermission("users.manage"),
  createPlatformUser,
);
router.patch(
  "/users/:id",
  platformAuthentication,
  requirePlatformPermission("users.manage"),
  updatePlatformUser,
);
router.delete(
  "/users/:id",
  platformAuthentication,
  requirePlatformPermission("users.manage"),
  deletePlatformUser,
);

router.get(
  "/smtp",
  platformAuthentication,
  requirePlatformPermission("users.manage"),
  getSmtp,
);
router.put(
  "/smtp",
  platformAuthentication,
  requirePlatformPermission("users.manage"),
  upsertSmtp,
);

router.get(
  "/cafe-email-templates",
  platformAuthentication,
  requirePlatformPermission("users.manage"),
  listCafeEmailTemplates,
);
router.put(
  "/cafe-email-templates/:key",
  platformAuthentication,
  requirePlatformPermission("users.manage"),
  upsertCafeEmailTemplate,
);
router.post(
  "/cafe-email-templates/:key/reset",
  platformAuthentication,
  requirePlatformPermission("users.manage"),
  resetCafeEmailTemplate,
);

module.exports = router;
