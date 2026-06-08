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
const generateJWT = (user) => {
  const expireAfter = 24 * 60 * 60; // **IN SECONDS**
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      exp: parseInt(new Date().getTime() / 1000 + expireAfter, 10),
    },
    JWT_SECRET,
  );
};
module.exports.toAuthJSON = function (user, role) {
  return {
    id: user.id,
    username: user.username,
    token: generateJWT(user),
    roleId: user.roleId,
    roleType: role.title,
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
