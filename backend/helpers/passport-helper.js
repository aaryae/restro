const { userModel, roleModel } = require("../models");
const messageConstant = require("../constants/message-constant");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { comparePassword, toAuthJSON } = require("./jwt-helper");

passport.use(
  "user-login",
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, username, password, done) => {
      const user = await userModel.findOne({
        raw: true,
        where: {
          username,
          isDeleted: false,
        },
      });
      if (user) {
        const role = await roleModel.findOne({
          raw: true,
          where: {
            id: user.roleId,
          },
        });
        comparePassword(password, user.password, (err, isSame) => {
          if (err) return done(err);
          if (isSame) {
            return done(null, { ...toAuthJSON(user, role, req.tenant) });
          } else {
            return done(null, false, {
              message: messageConstant.EN.USERNAME_PASSWORD_INCORRECT,
            });
          }
        });
      } else {
        return done(null, false, {
          message: messageConstant.EN.USER_INFO_NOT_FOUND,
        });
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
