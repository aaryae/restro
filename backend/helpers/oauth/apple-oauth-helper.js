const passport = require("passport");
const { customerModel } = require("../../models");

const AppleStrategy = require("passport-apple");
passport.use(
  new AppleStrategy(
    {
      clientID: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
      teamID: "",
      callbackURL: "http://localhost:8080/api/v1/customer/apple/callback",
      keyID: "",
      privateKeyLocation: "",
    },
    async (accessToken, refreshToken, idToken, profile, cb) => {
      try {
        let customer;
        if (profile.emails && profile.emails.length > 0) {
          const email = profile.emails[0].value;
          customer = await customerModel.findOne({ where: { email } });
          if (customer) {
            if (!customer.appleId) {
              customer.appleId = profile.id;
              await customer.save();
            }
          } else {
            customer = await customerModel.create({
              email,
              username: `${profile?.name?.givenName} ${profile?.name?.familyName}`,
              appleId: profile.id,
              isEmailVerified: true,
              isActive: true,
              gender: "other",
            });
          }
        } else {
          customer = await customerModel.findOne({
            where: { appleId: profile.id },
          });
          if (!customer) {
            customer = await customerModel.create({
              username: `${profile?.name?.givenName} ${profile?.name?.familyName}`,
              appleId: appleId.id,
              gender: "other",
            });
          }
        }
        return cb(null, customer);
      } catch (error) {
        return cb(error);
      }
    },
  ),
);

passport.serializeUser((customer, cb) => {
  cb(null, customer.id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    const customer = await customerModel.findByPk(id);

    cb(null, customer || false);
  } catch (error) {
    cb(error);
  }
});
