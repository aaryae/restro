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

module.exports = {
  apiRateLimiter,
};
