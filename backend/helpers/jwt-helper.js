const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../configs/credentials");
const expireAfter = Number(process.env.CUSTOMER_LOGIN_EXPIRATION_TIME);

module.exports.hash = (password, callback) => {
  bcrypt.hash(password, 10, callback);
};

module.exports.comparePassword = (password, hash, callback) => {
  return bcrypt.compare(password, hash, callback);
};

module.exports.hashSync = (password) => {
  const hash = bcrypt.hashSync(password, 10);
  return hash;
};

module.exports.comparePasswordSync = async (password, hash) => {
  const isSame = bcrypt.compareSync(password, hash);
  return isSame;
};

//this is for admin user
const generateJWT = (user, tenant) => {
  const expireAfter = 24 * 60 * 60; // **IN SECONDS**
  const payload = {
    id: user.id,
    email: user.email,
    roleId: user.roleId,
    exp: parseInt(new Date().getTime() / 1000 + expireAfter, 10),
  };
  if (tenant?.id) {
    payload.tenantId = tenant.id;
    payload.slug = tenant.slug;
  }
  return jwt.sign(payload, JWT_SECRET);
};
module.exports.generateJWT = generateJWT;
module.exports.toAuthJSON = function (user, role, tenant) {
  return {
    id: user.id,
    username: user.username,
    token: generateJWT(user, tenant),
    roleId: user.roleId,
    roleType: role.title,
    ...(tenant?.slug
      ? { tenantId: tenant.id, slug: tenant.slug }
      : {}),
  };
};

module.exports.verifyToken = async function (token) {
  return await jwt.verify(token, JWT_SECRET);
};

// this is for customer user
module.exports.generateCustomerJWT = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      exp: parseInt(Date.now() / 1000 + expireAfter, 10),
    },
    "customer",
  );
};
module.exports.toCustomerAuthJSON = function (user, role) {
  return {
    id: user.id,
    username: user.username,
    token: generateCustomerJWT(user),
  };
};
module.exports.verifyCustomerToken = async function (token) {
  try {
    return await jwt.verify(token, "customer");
  } catch (error) {
    return false;
  }
};

/** Trial / serve.servecafe.app account (before or after cafe creation). */
const TRIAL_JWT_SECRET = process.env.TRIAL_JWT_SECRET || `${JWT_SECRET}:trial`;

module.exports.generateTrialJWT = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      tenantId: user.tenantId || null,
      typ: "trial",
      exp: parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60, 10),
    },
    TRIAL_JWT_SECRET,
  );
};

module.exports.toTrialAuthJSON = function (user, tenant) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    phone: user.phone,
    tenantId: user.tenantId || null,
    token: module.exports.generateTrialJWT(user),
    ...(tenant
      ? {
          tenant: {
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
            status: tenant.status,
            schemaName: tenant.schemaName,
          },
        }
      : {}),
  };
};

module.exports.verifyTrialToken = async function (token) {
  return jwt.verify(token, TRIAL_JWT_SECRET);
};
