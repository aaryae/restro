"use strict";

const axios = require("axios");
const { Op } = require("sequelize");
const { trialUserModel, tenantModel } = require("../../models");
const { hashPassword, comparePasswords } = require("../../utils/bcrypt");
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

function splitName(fullName) {
  const parts = String(fullName || "Owner").trim().split(/\s+/);
  return {
    firstName: parts[0] || "Owner",
    lastName: parts.slice(1).join(" ") || "User",
  };
}

function usernameFromEmail(email) {
  const base = String(email)
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 24);
  return base || "owner";
}

async function uniqueUsername(base) {
  let candidate = base;
  let n = 0;
  while (await trialUserModel.findOne({ where: { username: candidate } })) {
    n += 1;
    candidate = `${base}${n}`.slice(0, 30);
  }
  return candidate;
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
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return {
      status: 400,
      success: false,
      message: "Name, email, and password are required",
    };
  }
  if (String(password).length < 6) {
    return {
      status: 400,
      success: false,
      message: "Password must be at least 6 characters",
    };
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await trialUserModel.findOne({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return {
      status: 409,
      success: false,
      message: "An account with this email already exists. Please sign in.",
    };
  }

  const username = await uniqueUsername(usernameFromEmail(normalizedEmail));
  const passwordHash = await hashPassword(password);
  const user = await trialUserModel.create({
    name: String(name).trim(),
    email: normalizedEmail,
    username,
    passwordHash,
    phone: phone || null,
  });

  const payload = await authPayload(user);
  payload.status = 201;
  payload.message = "Account created successfully";
  return payload;
};

const login = async (req) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return {
      status: 400,
      success: false,
      message: "Email and password are required",
    };
  }

  const user = await trialUserModel.findOne({
    where: { email: String(email).trim().toLowerCase() },
  });
  if (!user || !user.passwordHash) {
    return {
      status: 401,
      success: false,
      message: "Invalid email or password",
    };
  }

  const ok = await comparePasswords(password, user.passwordHash);
  if (!ok) {
    return {
      status: 401,
      success: false,
      message: "Invalid email or password",
    };
  }

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

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (clientId && profile.aud !== clientId) {
    return {
      status: 401,
      success: false,
      message: "Google credential audience mismatch",
    };
  }

  const email = String(profile.email || "")
    .trim()
    .toLowerCase();
  if (!email || profile.email_verified === "false") {
    return {
      status: 400,
      success: false,
      message: "Google account email is required",
    };
  }

  let user = await trialUserModel.findOne({
    where: {
      [Op.or]: [{ googleId: profile.sub }, { email }],
    },
  });

  if (user) {
    if (!user.googleId) {
      await user.update({ googleId: profile.sub });
    }
  } else {
    const name = profile.name || email.split("@")[0];
    const username = await uniqueUsername(usernameFromEmail(email));
    user = await trialUserModel.create({
      email,
      name,
      username,
      googleId: profile.sub,
      passwordHash: null,
    });
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
      reason: exists ? "Already taken" : null,
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

  // Owner POS password: explicit body, or reuse trial password, or temp
  let ownerPassword = cafePassword;
  if (!ownerPassword && user.passwordHash) {
    // Can't reverse hash — generate a temp password and return once
    ownerPassword = `Serve${Math.random().toString(36).slice(2, 10)}!`;
  }
  if (!ownerPassword) {
    ownerPassword = `Serve${Math.random().toString(36).slice(2, 10)}!`;
  }

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
      status: 500,
      success: false,
      message: err.message || "Failed to create restaurant",
    };
  }

  const tenant = await tenantModel.findByPk(result.tenantId);
  if (tenant) {
    await tenant.update({
      businessType: businessType || null,
      address: address || null,
      ownerPhone: phoneToUse,
    });
  }

  await user.update({
    tenantId: result.tenantId,
    phone: phoneToUse || user.phone,
  });
  await user.reload();

  // Admin JWT for POS (owner was seeded as roleId 1)
  const adminToken = generateJWT(
    {
      id: 1,
      email: user.email,
      roleId: 1,
    },
    tenant,
  );

  // Auth middleware requires an active session log in the tenant schema.
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
    () => createSessionLog({ id: 1 }, req),
  );

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
        schemaName: tenant.schemaName,
      },
      // POS login credentials for this cafe
      pos: {
        username: user.username,
        temporaryPassword: cafePassword ? undefined : ownerPassword,
        token: adminToken,
        authHeader: `Admin ${adminToken}`,
        tenantSlug: tenant.slug,
      },
    },
  };
};

module.exports = {
  register,
  login,
  googleAuth,
  me,
  checkSlug,
  suggestRestaurantSlug,
  createRestaurant,
};
