const passport = require("passport");
const { customerModel } = require("../../models");

const FacebookStrategy = require("passport-facebook").Strategy;
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: [
        "id",
        "displayName",
        "email",
        "birthday",
        "friends",
        "first_name",
        "last_name",
        "middle_name",
        "gender",
        "link",
      ],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let customer;
        if (profile.emails && profile.emails.length > 0) {
          const email = profile.emails[0].value;
          customer = await customerModel.findOne({ where: { email } });
          if (customer) {
            if (!customer.facebookId) {
              customer.facebookId = profile.id;
              await customer.save();
            }
          } else {
            customer = await customerModel.create({
              email,
              username: `${profile?.name?.givenName} ${profile?.name?.familyName}`,
              facebookId: profile.id,
              isEmailVerified: true,
              isActive: true,
              gender: "other",
            });
          }
        } else {
          customer = await customerModel.findOne({
            where: { facebookId: profile.id },
          });
          if (!customer) {
            customer = await customerModel.create({
              username: `${profile.name.givenName} ${profile.name.familyName}`,
              facebookId: profile.id,
              isEmailVerified: true,
              isActive: true,
              gender: "other",
            });
          }
        }
        return done(null, customer);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.serializeUser((customer, done) => {
  done(null, customer.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const customer = await customerModel.findByPk(id);

    done(null, customer || false);
  } catch (error) {
    done(error);
  }
});
