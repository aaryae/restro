const rateLimit = require("express-rate-limit");
// REDIS EXCLUSION
// const redis = require("../configs/redis");

const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_TIME_MS = 15 * 60 * 1000;

// REDIS EXCLUSION
// function loginAttemptMiddleware(req, res, next) {
//   const key = req.deviceFingerprint;

//   redis.get(key).then((attemptJSON) => {
//     const attempt = attemptJSON ? JSON.parse(attemptJSON) : null;

//     if (attempt && attempt.blockUntil && attempt.blockUntil > Date.now()) {
//       return res.status(429).json({
//         success: false,
//         msg: "Too many login attempts. Please try again later.",
//       });
//     }

//     const originalSend = res.send;

//     res.send = async function (body) {
//       try {
//         const data = typeof body === "string" ? JSON.parse(body) : body;

//         if (!data.success) {
//           const current = attempt || { count: 0, blockUntil: null };
//           current.count += 1;

//           if (current.count >= MAX_FAILED_ATTEMPTS) {
//             current.blockUntil = Date.now() + BLOCK_TIME_MS;
//           }

//           await redis.set(key, JSON.stringify(current), "PX", BLOCK_TIME_MS);
//         } else {
//           await redis.del(key);
//         }
//       } catch (err) {
//         console.error("Failed to process login rate limit logic:", err);
//       }

//       return originalSend.call(this, body);
//     };

//     next();
//   });
// }

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
  //require when REDIS enabled   loginAttemptMiddleware,
  apiRateLimiter,
};
