const { generateCustomerJWT } = require("./jwt-helper");
const passport = require("passport");

const customerLoginHelper = async (user) => {
  try {
    const token = generateCustomerJWT({
      id: user.id,
      username: user?.username,
      email: user?.email,
      isGuest: user?.isGuest,
    });
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
