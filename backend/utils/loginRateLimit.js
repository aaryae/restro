const rateLimit = require("express-rate-limit");

const apiRateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    msg: "Too many requests, please try again later.",
  },
  // Custom fingerprint key — disable v7 IP-key validation (throws 500 otherwise).
  validate: false,
  keyGenerator: (req) => req.deviceFingerprint || req.ip || "unknown",
});

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPT_MAX = 50;

const loginAttempts = new Map();

function clientKey(req) {
  return req.deviceFingerprint || req.ip || "unknown";
}

const skipHardcoreQa = (req) =>
  process.env.NODE_ENV === "development" &&
  process.env.HARDCORE_QA_ENABLED === "true" &&
  req.headers["x-hardcore-qa"] === "1";

function pruneExpiredAttempts(now = Date.now()) {
  for (const [key, state] of loginAttempts) {
    if (!state || state.resetAt <= now) loginAttempts.delete(key);
  }
}

function getAttemptState(key) {
  const now = Date.now();
  const state = loginAttempts.get(key);
  if (!state || state.resetAt <= now) {
    return { count: 0, resetAt: now + LOGIN_WINDOW_MS };
  }
  return state;
}

function remainingLoginAttempts(req) {
  if (skipHardcoreQa(req)) return LOGIN_ATTEMPT_MAX;
  const state = getAttemptState(clientKey(req));
  return Math.max(0, LOGIN_ATTEMPT_MAX - state.count);
}

function recordLoginFailure(req) {
  if (skipHardcoreQa(req)) return remainingLoginAttempts(req);
  pruneExpiredAttempts();
  const key = clientKey(req);
  const state = getAttemptState(key);
  const resetAt =
    state.count === 0 ? Date.now() + LOGIN_WINDOW_MS : state.resetAt;
  loginAttempts.set(key, { count: state.count + 1, resetAt });
  return remainingLoginAttempts(req);
}

function clearLoginFailures(req) {
  loginAttempts.delete(clientKey(req));
}

function wrongPasswordMessage(req) {
  const left = remainingLoginAttempts(req);
  if (left <= 0) {
    return "Incorrect password. No attempts remaining. Please try again in 15 minutes.";
  }
  const noun = left === 1 ? "attempt" : "attempts";
  return `Incorrect password. ${left} ${noun} remaining.`;
}

function loginRateLimiter(req, res, next) {
  if (skipHardcoreQa(req)) return next();
  pruneExpiredAttempts();
  if (remainingLoginAttempts(req) <= 0) {
    return res.status(429).json({
      success: false,
      status: 429,
      msg: "Too many login attempts. Please try again in 15 minutes.",
      message: "Too many login attempts. Please try again in 15 minutes.",
    });
  }
  next();
}

/** Tight limit so reset emails cannot be used to flood an inbox. */
const forgotPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    msg: "Too many reset requests. Please try again in 15 minutes.",
    message: "Too many reset requests. Please try again in 15 minutes.",
    status: 429,
  },
  keyGenerator: clientKey,
  skip: skipHardcoreQa,
});

/** Guessing a 6-digit reset code should not get 50 tries. */
const resetPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    msg: "Too many reset attempts. Please try again in 15 minutes.",
    message: "Too many reset attempts. Please try again in 15 minutes.",
    status: 429,
  },
  keyGenerator: clientKey,
  skip: skipHardcoreQa,
});

/** Stricter limit for Google OAuth + cafe provisioning. */
const provisionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    msg: "Too many attempts. Please try again in 15 minutes.",
    status: 429,
  },
  keyGenerator: clientKey,
  skip: skipHardcoreQa,
});

module.exports = {
  apiRateLimiter,
  loginRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
  provisionRateLimiter,
  recordLoginFailure,
  clearLoginFailures,
  remainingLoginAttempts,
  wrongPasswordMessage,
  LOGIN_ATTEMPT_MAX,
};
