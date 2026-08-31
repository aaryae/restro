const passport = require("passport");
const { customerModel } = require("../../models");
const AppleStrategy = require("passport-apple");

const appleClientId = process.env.APPLE_CLIENT_ID;
const appleClientSecret = process.env.APPLE_CLIENT_SECRET;

if (appleClientId && appleClientSecret) {
  passport.use(
    new AppleStrategy(
      {
        clientID: appleClientId,
        clientSecret: appleClientSecret,
        teamID: process.env.APPLE_TEAM_ID || "",
        callbackURL:
          process.env.APPLE_CALLBACK_URL ||
          "http://localhost:8080/api/v1/customer/apple/callback",
        keyID: process.env.APPLE_KEY_ID || "",
        privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH || "",
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
                appleId: profile.id,
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
} else {
  console.warn(
    "[oauth] Apple strategy skipped (set APPLE_CLIENT_ID and APPLE_CLIENT_SECRET to enable)",
  );
}

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
