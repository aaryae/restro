"use strict";

const crypto = require("crypto");

const OTP_DIGITS = Math.min(
  8,
  Math.max(6, parseInt(process.env.OTP_DIGITS || "6", 10) || 6),
);
const OTP_TTL_MS =
  parseInt(process.env.OTP_DURATION_MS || "", 10) || 10 * 60 * 1000;

function otpPepper() {
  return (
    process.env.TRIAL_JWT_SECRET ||
    process.env.JWT_SECRET ||
    "serve-otp-dev-only"
  );
}

function hashOtp(otp) {
  return crypto
    .createHmac("sha256", otpPepper())
    .update(String(otp || "").trim(), "utf8")
    .digest("hex");
}

function generateNumericOtp(digits = OTP_DIGITS) {
  const max = 10 ** digits;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(digits, "0");
}

/**
 * Email OTP: random code + HMAC (pepper from JWT secret) stored on the user.
 * HMAC stops a DB dump from being brute-forced (6-digit space is tiny).
 */
async function generateOTPForUser() {
  const otp = generateNumericOtp();
  const otpSecret = hashOtp(otp);
  return { otp, otpSecret, expiresInMs: OTP_TTL_MS };
}

async function verifyOTPForUser(otp, otpSecret) {
  const candidate = hashOtp(otp);
  if (!otpSecret || candidate.length !== otpSecret.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(candidate, "utf8"),
    Buffer.from(otpSecret, "utf8"),
  );
}

module.exports = {
  generateOTPForUser,
  verifyOTPForUser,
  OTP_TTL_MS,
  OTP_DIGITS,
};
