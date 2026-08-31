"use strict";

const crypto = require("crypto");
const axios = require("axios");
const { Op } = require("sequelize");
const { trialUserModel, tenantModel, sequelize, sessionLogsModel } = require("../../models");
const { hashPassword, comparePasswords } = require("../../utils/bcrypt");
const {
  recordLoginFailure,
  clearLoginFailures,
  wrongPasswordMessage,
} = require("../../utils/loginRateLimit");
const {
  toTrialAuthJSON,
  generateJWT,
} = require("../../helpers/jwt-helper");
const { provisionTenant } = require("../../lib/tenant-provisioner");
const { nextAvailableSlug, suggestSlug } = require("../../lib/trial-slug");
const { validateSlug } = require("../../lib/tenant-slug");
const { RESERVED_SLUGS } = require("../../constants/tenant-constants");
const { runWithTenantContext } = require("../../lib/tenant-context");
const { createSessionLog } = require("./session-logs");
const {
  normalizeUsername,
  validateUsernameFormat,
  isUsernameTaken,
  claimUsername,
} = require("../../lib/global-username");
const { generateOTPForUser, verifyOTPForUser, OTP_TTL_MS } = require("../../utils/otp");
const { sendOtpMail } = require("../../utils/mailer");
const { buildPosBootstrapUrl } = require("../../lib/pos-public-url");
const logger = require("../../configs/logger");

async function issuePosSession(user, tenant, req) {
  const [rows] = await sequelize.query(
    `SELECT id, email, "roleId", username
     FROM "${tenant.schemaName}".users
     WHERE lower(email) = lower(:email)
     ORDER BY id ASC
     LIMIT 1`,
    { replacements: { email: user.email } },
  );
  const owner = rows[0];
  if (!owner) return null;

  const [superAdminRows] = await sequelize.query(
    `SELECT id FROM "${tenant.schemaName}".roles
     WHERE title = 'Super Admin'
     ORDER BY id ASC
     LIMIT 1`,
  );
  const superAdminRoleId = Number(superAdminRows[0]?.id || 1);
  const ownerRoleId = Number(owner.roleId);

  // Cafe owner from Serve should always be Super Admin so POS mutations work.
  if (ownerRoleId !== superAdminRoleId) {
    await sequelize.query(
      `UPDATE "${tenant.schemaName}".users
       SET "roleId" = :roleId, "updatedAt" = NOW()
       WHERE id = :id`,
      { replacements: { roleId: superAdminRoleId, id: owner.id } },
    );
    owner.roleId = superAdminRoleId;
  } else {
    owner.roleId = ownerRoleId;
  }

  let sessionLog;
  await runWithTenantContext(
    {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        schemaName: tenant.schemaName,
        status: tenant.status,
      },
    },
    async () => {
      sessionLog = await createSessionLog({ id: owner.id }, req);
    },
  );
  const token = generateJWT(
    { id: Number(owner.id), email: owner.email, roleId: Number(owner.roleId) },
    tenant,
    sessionLog?.id,
  );

  return {
    username: owner.username,
    email: owner.email,
    token,
    authHeader: `Admin ${token}`,
    tenantSlug: tenant.slug,
    url: buildPosBootstrapUrl(tenant.slug, token, req),
  };
}

function splitName(fullName) {
  const parts = String(fullName || "Owner").trim().split(/\s+/);
  return {
    firstName: parts[0] || "Owner",
    lastName: parts.slice(1).join(" ") || "User",
  };
}

function usernameFromHandle(value) {
  return normalizeUsername(value) || "owner";
}

/** Prefer typed username; else name handle; else email local-part. */
function usernameFromIdentity(name, email, preferred) {
  if (preferred) {
    const checked = validateUsernameFormat(preferred);
    if (checked.ok) return checked.username;
  }
  const fromName = usernameFromHandle(name);
  if (fromName && fromName !== "owner") return fromName;
  return usernameFromHandle(String(email || "").split("@")[0]);
}

function generateTempPassword() {
  return `Serve${crypto.randomBytes(6).toString("base64url")}!`;
}

function isEmailVerified(value) {
  return value === true || value === "true";
}

async function uniqueUsername(base) {
  let candidate = normalizeUsername(base) || "owner";
  let n = 0;
  while (await isUsernameTaken(candidate)) {
    n += 1;
    candidate = `${normalizeUsername(base) || "owner"}${n}`.slice(0, 30);
  }
  return candidate;
}

const OTP_PURPOSE = {
  VERIFY: "verify",
  RESET: "reset",
};
const OTP_RESEND_COOLDOWN_MS = 45 * 1000;
const OTP_MAX_RESET_FAILURES = 5;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 72;
const GENERIC_RESET_MESSAGE =
  "If an account exists for that username or email, we sent a reset code.";
const OTP_WRITE = { logging: false };
const resetOtpFailures = new Map();

function wrapOtpSecret(purpose, otpSecret) {
  return `${purpose}:${otpSecret}`;
}

function unwrapOtpSecret(stored, purpose) {
  const value = String(stored || "");
  if (!value) return null;
  const sep = value.indexOf(":");
  if (sep === -1) {
    return purpose === OTP_PURPOSE.VERIFY ? value : null;
  }
  const storedPurpose = value.slice(0, sep);
  const hash = value.slice(sep + 1);
  return storedPurpose === purpose && hash ? hash : null;
}

function storedOtpPurpose(user) {
  const value = String(user.otpSecret || "");
  const sep = value.indexOf(":");
  if (sep === -1) return value ? OTP_PURPOSE.VERIFY : null;
  return value.slice(0, sep);
}

function otpIssuedRecently(user, purpose, cooldownMs = OTP_RESEND_COOLDOWN_MS) {
  if (!user?.otpExpiresAt) return false;
  if (purpose && storedOtpPurpose(user) !== purpose) return false;
  const issuedAt = new Date(user.otpExpiresAt).getTime() - OTP_TTL_MS;
  return Date.now() - issuedAt < cooldownMs;
}

async function issueAndSendOtp(user, purpose = OTP_PURPOSE.VERIFY, { waitForMail = true } = {}) {
  if (otpIssuedRecently(user, purpose)) {
    return {
      needsOtp: true,
      throttled: true,
      ...(purpose === OTP_PURPOSE.VERIFY
        ? { email: user.email, username: user.username }
        : {}),
    };
  }

  const { otp, otpSecret } = await generateOTPForUser();
  await user.update(
    {
      otpSecret: wrapOtpSecret(purpose, otpSecret),
      otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
    OTP_WRITE,
  );
  if (purpose === OTP_PURPOSE.RESET) {
    resetOtpFailures.delete(user.id);
  }
  const mail = sendOtpMail({
    to: user.email,
    name: user.name,
    otp,
    purpose,
  });
  if (waitForMail) {
    await mail;
  } else {
    mail.catch((err) => {
      logger.error(`[OTP] Failed to email reset code: ${err.message}`);
    });
  }
  return {
    needsOtp: true,
    ...(purpose === OTP_PURPOSE.VERIFY
      ? { email: user.email, username: user.username }
      : {}),
  };
}

async function syncTenantOwnerPassword(user, passwordHash) {
  if (!user?.tenantId || !user.email) return;
  const tenant = await tenantModel.findByPk(user.tenantId);
  const schemaName = String(tenant?.schemaName || "");
  if (!/^[a-z0-9_]+$/i.test(schemaName)) return;

  await runWithTenantContext(
    {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        schemaName: tenant.schemaName,
        status: tenant.status,
      },
    },
    async () => {
      await sequelize.query(
        `UPDATE users
         SET password = :password, "updatedAt" = NOW()
         WHERE lower(email) = lower(:email)`,
        { replacements: { password: passwordHash, email: user.email } },
      );
      const [rows] = await sequelize.query(
        `SELECT id FROM users WHERE lower(email) = lower(:email) ORDER BY id ASC LIMIT 1`,
        { replacements: { email: user.email } },
      );
      const ownerId = Number(rows[0]?.id);
      if (ownerId) {
        await sessionLogsModel.update(
          { logout: new Date() },
          { where: { userId: ownerId, logout: null } },
        );
      }
    },
  );
}

async function authPayload(user) {
  let tenant = null;
  if (user.tenantId) {
    tenant = await tenantModel.findByPk(user.tenantId);
  }
  return {
    status: 200,
    success: true,
    message: "Signed in successfully",
    data: toTrialAuthJSON(user, tenant),
  };
}

const register = async (req) => {
  const { name, email, password, phone, username: rawUsername } = req.body;
  if (!name || !email || !password || !rawUsername) {
    return {
      status: 400,
      success: false,
      message: "Name, username, email, and password are required",
    };
  }
  if (String(password).length < 6) {
    return {
      status: 400,
      success: false,
      message: "Password must be at least 6 characters",
    };
  }

  const usernameCheck = validateUsernameFormat(rawUsername);
  if (!usernameCheck.ok) {
    return {
      status: 400,
      success: false,
      message: usernameCheck.message,
    };
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await trialUserModel.findOne({
    where: { email: normalizedEmail },
  });
  if (existing) {
    if (!existing.emailVerified && existing.passwordHash) {
      const passwordOk = await comparePasswords(
        password,
        existing.passwordHash,
      );
      if (passwordOk) {
        await existing.update({
          name: String(name).trim(),
          username: usernameCheck.username,
          phone: phone || existing.phone,
        });
        try {
          await claimUsername(usernameCheck.username, { source: "trial" });
        } catch (err) {
          if (err.status === 409 && existing.username !== usernameCheck.username) {
            return {
              status: 409,
              success: false,
              message: err.message,
            };
          }
          if (err.status && err.status !== 409) {
            return { status: err.status, success: false, message: err.message };
          }
        }
        const otpData = await issueAndSendOtp(existing);
        return {
          status: 200,
          success: true,
          message: "Check your email for the verification code",
          data: otpData,
        };
      }
    }
    return {
      status: 409,
      success: false,
      message: "An account with this email already exists. Please sign in.",
    };
  }

  if (await isUsernameTaken(usernameCheck.username)) {
    return {
      status: 409,
      success: false,
      message: "This username is already taken",
    };
  }

  let username;
  try {
    username = await claimUsername(usernameCheck.username, { source: "trial" });
  } catch (err) {
    return {
      status: err.status || 500,
      success: false,
      message: err.message || "Could not reserve username",
    };
  }

  const passwordHash = await hashPassword(password);
  const user = await trialUserModel.create({
    name: String(name).trim(),
    email: normalizedEmail,
    username,
    passwordHash,
    phone: phone || null,
    emailVerified: false,
  });

  const otpData = await issueAndSendOtp(user);
  return {
    status: 201,
    success: true,
    message: "Account created. Enter the OTP sent to your email.",
    data: otpData,
  };
};

const verifyOtp = async (req) => {
  const { email, username, otp } = req.body || {};
  if (!otp || (!email && !username)) {
    return {
      status: 400,
      success: false,
      message: "OTP and email or username are required",
    };
  }

  const loginId = String(email || username || "").trim();
  const user = await findTrialUserByLogin(loginId);
  if (!user) {
    return {
      status: 404,
      success: false,
      message: "Account not found",
    };
  }

  if (user.emailVerified) {
    return {
      status: 400,
      success: false,
      message: "This account is already verified. Please sign in.",
    };
  }

  const secret = unwrapOtpSecret(user.otpSecret, OTP_PURPOSE.VERIFY);
  if (!secret || !user.otpExpiresAt) {
    return {
      status: 400,
      success: false,
      message: "No OTP pending. Request a new code.",
    };
  }

  if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
    return {
      status: 400,
      success: false,
      message: "OTP expired. Request a new code.",
    };
  }

  const valid = await verifyOTPForUser(otp, secret);
  if (!valid) {
    recordLoginFailure(req);
    return {
      status: 401,
      success: false,
      message: "Invalid verification code",
    };
  }

  await user.update(
    {
      emailVerified: true,
      otpSecret: null,
      otpExpiresAt: null,
    },
    OTP_WRITE,
  );
  clearLoginFailures(req);

  const payload = await authPayload(user);
  payload.message = "Email verified successfully";
  return payload;
};

const resendOtp = async (req) => {
  const { email, username } = req.body || {};
  const loginId = String(email || username || "").trim();
  if (!loginId) {
    return {
      status: 400,
      success: false,
      message: "Email or username is required",
    };
  }

  const user = await findTrialUserByLogin(loginId);
  if (!user) {
    return {
      status: 404,
      success: false,
      message: "Account not found",
    };
  }

  if (user.emailVerified) {
    return {
      status: 400,
      success: false,
      message: "This account is already verified. Please sign in.",
    };
  }

  const otpData = await issueAndSendOtp(user, OTP_PURPOSE.VERIFY);
  return {
    status: 200,
    success: true,
    message: "A new verification code was sent",
    data: otpData,
  };
};

function invalidResetResult(req) {
  recordLoginFailure(req);
  return {
    status: 401,
    success: false,
    message: "Invalid or expired code. Check the code and try again.",
  };
}

async function burnResetOtp(user) {
  resetOtpFailures.delete(user.id);
  await user.update({ otpSecret: null, otpExpiresAt: null }, OTP_WRITE);
}

const forgotPassword = async (req) => {
  const loginId = String(
    req.body.login || req.body.email || req.body.username || "",
  ).trim();
  if (!loginId || loginId.length < 3) {
    return {
      status: 400,
      success: false,
      message: "Enter your username or email",
    };
  }

  const generic = {
    status: 200,
    success: true,
    message: GENERIC_RESET_MESSAGE,
    data: { needsOtp: true },
  };

  const user = await findTrialUserByLogin(loginId);
  const canReset = Boolean(
    user && user.isActive !== false && user.passwordHash && user.email,
  );

  if (canReset) {
    await issueAndSendOtp(user, OTP_PURPOSE.RESET, { waitForMail: false });
  }

  return generic;
};

const resetPassword = async (req) => {
  const loginId = String(
    req.body.login || req.body.email || req.body.username || "",
  ).trim();
  const otp = String(req.body.otp || "").trim();
  const newPassword = String(req.body.newPassword || "");

  if (!loginId || !otp) {
    return {
      status: 400,
      success: false,
      message: "Username or email, and the code, are required",
    };
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      status: 400,
      success: false,
      message: "Password must be at least 6 characters",
    };
  }
  if (newPassword.length > MAX_PASSWORD_LENGTH) {
    return {
      status: 400,
      success: false,
      message: "Password is too long",
    };
  }

  const user = await findTrialUserByLogin(loginId);
  if (!user || !user.passwordHash || user.isActive === false) {
    await verifyOTPForUser(otp, "0".repeat(64));
    return invalidResetResult(req);
  }

  const secret = unwrapOtpSecret(user.otpSecret, OTP_PURPOSE.RESET);
  if (!secret || !user.otpExpiresAt) {
    await verifyOTPForUser(otp, "0".repeat(64));
    return invalidResetResult(req);
  }

  if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
    await burnResetOtp(user);
    return invalidResetResult(req);
  }

  const valid = await verifyOTPForUser(otp, secret);
  if (!valid) {
    const fails = (resetOtpFailures.get(user.id) || 0) + 1;
    resetOtpFailures.set(user.id, fails);
    if (fails >= OTP_MAX_RESET_FAILURES) {
      await burnResetOtp(user);
    }
    return invalidResetResult(req);
  }

  const passwordHash = await hashPassword(newPassword);
  const changedAt = new Date();
  const [consumed] = await trialUserModel.update(
    {
      passwordHash,
      emailVerified: true,
      otpSecret: null,
      otpExpiresAt: null,
      passwordChangedAt: changedAt,
    },
    {
      where: {
        id: user.id,
        otpSecret: user.otpSecret,
        otpExpiresAt: { [Op.gt]: new Date() },
      },
      ...OTP_WRITE,
    },
  );
  if (!consumed) {
    return invalidResetResult(req);
  }

  resetOtpFailures.delete(user.id);
  user.passwordHash = passwordHash;
  user.emailVerified = true;
  user.otpSecret = null;
  user.otpExpiresAt = null;
  user.passwordChangedAt = changedAt;

  try {
    await syncTenantOwnerPassword(user, passwordHash);
  } catch (err) {
    logger.warn(`[reset-password] POS password sync skipped: ${err.message}`);
  }

  clearLoginFailures(req);
  const payload = await authPayload(user);
  payload.message = "Password updated. You are signed in.";
  return payload;
};

const checkUsername = async (req) => {
  const raw = String(req.query.username || "").trim();
  const checked = validateUsernameFormat(raw);
  if (!checked.ok) {
    return {
      status: 200,
      success: true,
      data: {
        username: checked.username,
        available: false,
        reason: checked.message,
      },
    };
  }

  const taken = await isUsernameTaken(checked.username);
  return {
    status: 200,
    success: true,
    data: {
      username: checked.username,
      available: !taken,
      reason: taken ? "This username is already taken" : null,
    },
  };
};

async function findTrialUserByLogin(loginId) {
  const value = String(loginId || "").trim();
  if (!value) return null;

  if (value.includes("@")) {
    return trialUserModel.findOne({
      where: { email: value.toLowerCase() },
    });
  }

  const username = normalizeUsername(value);
  return trialUserModel.findOne({
    where: {
      [Op.or]: [
        { username: { [Op.iLike]: username } },
        { email: { [Op.iLike]: value.toLowerCase() } },
      ],
    },
  });
}

const login = async (req) => {
  const loginId = String(
    req.body.login || req.body.email || req.body.username || "",
  ).trim();
  const { password } = req.body;
  if (!loginId || !password) {
    return {
      status: 400,
      success: false,
      message: "Username or email, and password are required",
    };
  }

  const user = await findTrialUserByLogin(loginId);
  if (!user || !user.passwordHash) {
    recordLoginFailure(req);
    return {
      status: 401,
      success: false,
      message: wrongPasswordMessage(req),
    };
  }

  const ok = await comparePasswords(password, user.passwordHash);
  if (!ok) {
    recordLoginFailure(req);
    return {
      status: 401,
      success: false,
      message: wrongPasswordMessage(req),
    };
  }

  if (!user.emailVerified) {
    const otpData = await issueAndSendOtp(user);
    return {
      status: 200,
      success: true,
      message: "Verify your email with the OTP we just sent",
      data: otpData,
    };
  }

  clearLoginFailures(req);
  return authPayload(user);
};

const googleAuth = async (req) => {
  const { credential } = req.body;
  if (!credential) {
    return {
      status: 400,
      success: false,
      message: "Google credential is required",
    };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return {
      status: 503,
      success: false,
      message: "Google sign-in is not configured on this server",
    };
  }

  let profile;
  try {
    const { data } = await axios.get(
      "https://oauth2.googleapis.com/tokeninfo",
      { params: { id_token: credential } },
    );
    profile = data;
  } catch {
    return {
      status: 401,
      success: false,
      message: "Invalid Google credential",
    };
  }

  if (profile.aud !== clientId) {
    return {
      status: 401,
      success: false,
      message: "Google credential audience mismatch",
    };
  }

  const email = String(profile.email || "")
    .trim()
    .toLowerCase();
  if (!email || !isEmailVerified(profile.email_verified)) {
    return {
      status: 400,
      success: false,
      message: "A verified Google account email is required",
    };
  }

  let user = await trialUserModel.findOne({
    where: { googleId: profile.sub },
  });

  if (!user) {
    const byEmail = await trialUserModel.findOne({ where: { email } });
    if (byEmail) {
      // Do not silently attach Google to a password account (takeover risk).
      if (byEmail.passwordHash && !byEmail.googleId) {
        return {
          status: 409,
          success: false,
          message:
            "An account with this email already exists. Please sign in with your password.",
        };
      }
      if (!byEmail.googleId) {
        await byEmail.update({ googleId: profile.sub });
      }
      user = byEmail;
    } else {
      const name = profile.name || email.split("@")[0];
      const username = await uniqueUsername(usernameFromIdentity(name, email));
      try {
        await claimUsername(username, { source: "trial" });
      } catch (err) {
        if (err.status === 409) {
          // uniqueUsername should avoid this; fall through with next candidate
        } else {
          throw err;
        }
      }
      user = await trialUserModel.create({
        email,
        name,
        username,
        googleId: profile.sub,
        passwordHash: null,
        emailVerified: true,
      });
    }
  }

  if (!user.emailVerified) {
    await user.update({ emailVerified: true });
  }

  return authPayload(user);
};

const me = async (req) => {
  const payload = await authPayload(req.trialUser);
  payload.message = "OK";
  return payload;
};

const checkSlug = async (req) => {
  const raw = String(req.query.slug || "").trim().toLowerCase();
  if (!raw) {
    return {
      status: 400,
      success: false,
      message: "Slug is required",
    };
  }

  try {
    validateSlug(raw);
  } catch (err) {
    return {
      status: 200,
      success: true,
      data: { slug: raw, available: false, reason: err.message },
    };
  }

  const exists = await tenantModel.findOne({ where: { slug: raw } });
  return {
    status: 200,
    success: true,
    data: {
      slug: raw,
      available: !exists,
      reason: exists
        ? `${raw}.servecafe.app is already taken`
        : null,
    },
  };
};

const suggestRestaurantSlug = async (req) => {
  const name = String(req.query.name || "").trim();
  const slug = await nextAvailableSlug(tenantModel, name || "cafe");
  return {
    status: 200,
    success: true,
    data: { slug, suggestedFrom: suggestSlug(name || "cafe") },
  };
};

const createRestaurant = async (req) => {
  const user = req.trialUser;

  if (user.tenantId) {
    const existing = await tenantModel.findByPk(user.tenantId);
    return {
      status: 409,
      success: false,
      message: "You already created a restaurant on this account.",
      data: existing
        ? {
            slug: existing.slug,
            name: existing.name,
            status: existing.status,
          }
        : null,
    };
  }

  const {
    name,
    phone,
    businessType,
    address,
    slug: requestedSlug,
    password: cafePassword,
  } = req.body;

  if (!name || !String(name).trim()) {
    return {
      status: 400,
      success: false,
      message: "Restaurant name is required",
    };
  }

  const slug = requestedSlug
    ? String(requestedSlug).trim().toLowerCase()
    : await nextAvailableSlug(tenantModel, name);

  try {
    validateSlug(slug);
  } catch (err) {
    return { status: 400, success: false, message: err.message };
  }

  if (RESERVED_SLUGS.includes(slug)) {
    return {
      status: 400,
      success: false,
      message: `Slug "${slug}" is reserved`,
    };
  }

  const taken = await tenantModel.findOne({ where: { slug } });
  if (taken) {
    return {
      status: 409,
      success: false,
      message: `Slug "${slug}" is already taken`,
    };
  }

  // Prefer password from register/login session (FE sends serve_pending_password).
  // Google-only users get a one-time temp password returned once.
  const usedClientPassword = Boolean(
    cafePassword && String(cafePassword).length >= 6,
  );
  const ownerPassword = usedClientPassword
    ? String(cafePassword)
    : generateTempPassword();

  const { firstName, lastName } = splitName(user.name);
  const phoneToUse = phone || user.phone || null;

  let result;
  try {
    result = await provisionTenant({
      slug,
      name: String(name).trim(),
      email: user.email,
      password: ownerPassword,
      phone: phoneToUse,
      firstName,
      lastName,
      username: user.username,
      trialDays: 14,
      status: "trial",
      businessType: businessType || null,
      address: address || null,
    });
  } catch (err) {
    return {
      status: err.status || 500,
      success: false,
      message: err.message || "Failed to create restaurant",
    };
  }

  const tenant = await tenantModel.findByPk(result.tenantId);
  if (!tenant) {
    return {
      status: 500,
      success: false,
      message: "Restaurant created but cafe record was not found",
    };
  }

  await tenant.update({
    businessType: businessType || null,
    address: address || null,
    ownerPhone: phoneToUse,
  });
  await tenant.reload();

  await user.update({
    tenantId: result.tenantId,
    phone: phoneToUse || user.phone,
  });
  await user.reload();

  try {
    await claimUsername(user.username, {
      source: "trial",
      tenantId: result.tenantId,
    });
  } catch {
    // Already claimed at register — fine.
  }

  const ownerUserId = result.ownerUserId;
  if (!ownerUserId) {
    return {
      status: 500,
      success: false,
      message: "Restaurant created but owner user was not found",
    };
  }

  const pos = await issuePosSession(user, tenant, req);
  if (!pos) {
    return {
      status: 500,
      success: false,
      message: "Restaurant created but POS session could not be issued",
    };
  }

  return {
    status: 201,
    success: true,
    message: "Restaurant created successfully",
    data: {
      ...toTrialAuthJSON(user, tenant),
      restaurant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        status: tenant.status,
        businessType: tenant.businessType,
        address: tenant.address,
        trialEndsAt: tenant.trialEndsAt,
      },
      pos: {
        ...pos,
        temporaryPassword: usedClientPassword ? undefined : ownerPassword,
      },
    },
  };
};

const posBootstrap = async (req) => {
  const user = req.trialUser;
  if (!user?.tenantId) {
    return {
      status: 409,
      success: false,
      message: "Create your cafe first.",
    };
  }

  const tenant = await tenantModel.findByPk(user.tenantId);
  if (!tenant) {
    return {
      status: 404,
      success: false,
      message: "Cafe not found for this account.",
    };
  }

  const pos = await issuePosSession(user, tenant, req);
  if (!pos) {
    return {
      status: 404,
      success: false,
      message: "POS user not found for this cafe.",
    };
  }

  return {
    status: 200,
    success: true,
    message: "POS session created",
    data: {
      pos,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
    },
  };
};

module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  checkUsername,
  googleAuth,
  me,
  checkSlug,
  suggestRestaurantSlug,
  createRestaurant,
  posBootstrap,
};
