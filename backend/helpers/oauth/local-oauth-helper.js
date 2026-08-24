const { customerModel, orderModel } = require("../../models");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { comparePassword, toAuthJSON } = require("../jwt-helper");

passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      const customer = await customerModel.findOne({
        where: {
          email,
        },
      });
      if (customer) {
        if (customer.isGuest === true) {
          return done(null, false, {
            status: 400,
            success: true,
            msg: "User is only a guest",
            data: null,
          });
        }
        if (customer.isEmailVerified === false) {
          return done(null, false, {
            status: 400,
            success: true,
            msg: "User email is not verified yet",
            data: null,
          });
        }
        if (customer.isActive === false) {
          return done(null, false, {
            status: 400,
            success: true,
            msg: "User account is not active please contact admin.",
            data: null,
          });
        }
        comparePassword(password, customer.password, (err, isSame) => {
          if (err) return done(err);
          if (isSame) {
            return done(null, customer);
          } else {
            return done(null, false, {
              status: 200,
              success: true,
              msg: "email or password incorrect",
              data: null,
            });
          }
        });
      } else {
        return done(null, false, {
          status: 401,
          success: false,
          msg: "User info not found",
          data: null,
        });
      }
    },
  ),
);

passport.serializeUser((customer, done) => {
  console.log(customer.id, "id");
  done(null, customer.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log(id);
    const customer = await customerModel.findOne({
      where: { id },
      include: [
        {
          model: orderModel,
          as: "orders",
        },
      ],
    });
    const customerData = customer.toJSON();
    done(null, customerData);
  } catch (err) {
    done(err);
  }
});
