"use strict";

const crypto = require("crypto");

const OTP_DIGITS = parseInt(process.env.OTP_DIGITS || "6", 10);
const OTP_TTL_MS = parseInt(process.env.OTP_DURATION_MS || "", 10) || 10 * 60 * 1000;

function generateNumericOtp(digits = OTP_DIGITS) {
  const max = 10 ** digits;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(digits, "0");
}

/**
 * Email OTP: random code + secret (hashed) stored on the user.
 * Returns plaintext otp once for mailing; store otpSecret + otpExpiresAt.
 */
async function generateOTPForUser() {
  const otp = generateNumericOtp();
  const otpSecret = crypto.createHash("sha256").update(otp).digest("hex");
  return { otp, otpSecret, expiresInMs: OTP_TTL_MS };
}

async function verifyOTPForUser(otp, otpSecret) {
  const candidate = crypto
    .createHash("sha256")
    .update(String(otp || "").trim())
    .digest("hex");
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
};
