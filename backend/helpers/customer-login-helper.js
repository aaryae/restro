const { generateCustomerJWT } = require("./jwt-helper");
const passport = require("passport");
// REDIS EXCLUSION
// const redis = require("../configs/redis");
const customerLoginHelper = async (user) => {
  try {
    const token = generateCustomerJWT({
      id: user.id,
      username: user?.username,
      email: user?.email,
      isGuest: user?.isGuest,
    });
    // REDIS EXCLUSION
    // await redis.set(
    //   `auth:${user.id}`,
    //   token,
    //   "EX",
    //   process.env.CUSTOMER_LOGIN_EXPIRATION_TIME,
    // );
    return token;
  } catch (e) {
    throw e;
  }
};

const userLoginPassport = (req, res, next) => {
  return new Promise((resolve, reject) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return reject(err);
      if (!user) return reject(info);
      resolve({ user, info });
    })(req, res, next);
  });
};

module.exports = { customerLoginHelper, userLoginPassport };
