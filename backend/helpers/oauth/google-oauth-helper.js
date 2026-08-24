const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { customerModel } = require("../../models"); // Adjust path to your models

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

passport.use(
  new GoogleStrategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google profile:", profile);
        let customer = await customerModel.findOne({
          where: { email: profile.emails[0].value },
        });
        if (customer) {
          // Email exists, update social ID if missing
          if (!customer.googleId) {
            customer.googleId = profile.id;
            await customer.save();
          }
        } else {
          // Create new customer
          customer = await customerModel.create({
            email: profile.emails[0]?.value,
            username: `${profile?.name?.givenName} ${profile?.name?.familyName}`,
            googleId: profile.id,
            isEmailVerified: true,
            isActive: true,
            gender: "other",
          });
        }
        console.log("Customer:", customer.dataValues);
        return done(null, customer);
      } catch (error) {
        console.error("Error in GoogleStrategy:", error);
        return done(error);
      }
    },
  ),
);

passport.serializeUser((customer, done) => {
  console.log("Serializing user ID:", customer.id);
  console.log("setting data==============");

  done(null, customer.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const customer = await customerModel.findByPk(id);
    console.log("getting data==============");

    console.log("Deserializing user:", customer ? customer.dataValues : null);
    done(null, customer || false);
  } catch (error) {
    console.error("Deserialize error:", error);
    done(error);
  }
});

module.exports = passport;
