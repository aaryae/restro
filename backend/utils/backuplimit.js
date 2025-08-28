// this file is for project where there is no used of redis

const rateLimit = require("express-rate-limit");

// REDIS EXCLUSION
// const redis = require("../configs/redis");

// const failedLoginAttempts = new Map(); // use this when project dont have redis

const MAX_FAILED_ATTEMPTS = 2;
const BLOCK_TIME_MS = 15 * 60 * 1000; // 15 mins

// require REDIS
// function loginAttemptMiddleware(req, res, next) {
//   const key = req.deviceFingerprint;

//   // const attempt = failedLoginAttempts.get(key);  // use this when project dont have redis

//   redis.get(key).then((attemptJson) => {
//     const attempt = attemptJson ? JSON.parse(attemptJson) : null;

//     // Check if user is blocked
//     if (attempt && attempt.blockUntil && attempt.blockUntil > Date.now()) {
//       return res.status(429).json({
//         success: false,
//         msg: "Too many login attempts. Please try again later.",
//       });
//     }

//     // Hook into res.send to inspect response
//     const originalSend = res.send;
//     res.send = async (body) => {
//       try {
//         const data = typeof body === "string" ? JSON.parse(body) : body;

//         if (!data.success) {
//           // const current = failedLoginAttempts.get(key) || {
//           //   count: 0,
//           //   blockUntil: null,   use this when project dont have redis
//           // };

//           const current = attempt || { count: 0, blockUntil: null };
//           current.count += 1;

//           if (current.count >= MAX_FAILED_ATTEMPTS) {
//             current.blockUntil = Date.now() + BLOCK_TIME_MS;
//           }
//           await redis.set(key, JSON.stringify(current), "PX", BLOCK_TIME_MS);
//           // failedLoginAttempts.set(key, current); // use this when project dont have redis
//         } else {
//           // On success, reset failed attempts
//           await redis.del(key);
//           // failedLoginAttempts.delete(key);  // use this when project dont have redis
//         }
//       } catch (err) {
//         console.error("Failed to parse response body", err);
//       }

//       return originalSend.call(this, body);
//     };

//     next();
//   });
// }

const apiRateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 1000,
  message: {
    success: false,
    msg: "Too many requests, please try again later",
  },
  keyGenerator: (req) => req.deviceFingerprint,
});

module.exports = {
  // require for redis loginAttemptMiddleware,
  apiRateLimiter,
};
