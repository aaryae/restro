const rateLimit = require("express-rate-limit");

const apiRateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    msg: "Too many requests, please try again later.",
  },
  keyGenerator: (req) => req.deviceFingerprint,
});

/** Brute-force protection for login / signup endpoints. */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    msg: "Too many login attempts. Please try again in 15 minutes.",
    status: 429,
  },
  keyGenerator: (req) => {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      "unknown";
    return `${ip}:${req.deviceFingerprint || "no-fp"}`;
  },
  skip: (req) =>
    process.env.NODE_ENV === "development" &&
    req.headers["x-hardcore-qa"] === "1",
});

module.exports = {
  apiRateLimiter,
  loginRateLimiter,
};
