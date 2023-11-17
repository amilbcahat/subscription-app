const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const authController = require("./../controllers/authController");
const User = require("./../models/userModel");
const dotenv = require("dotenv");
passport.serializeUser(function (user, done) {
  console.log(user);
  console.log(user.id);
  /*
    From the user take just the id (to minimize the cookie size) and just pass the id of the user
    to the done callback
    PS: You dont have to do it like this its just usually done like this
    */
  done(null, user.gId);
});

passport.deserializeUser(async function (id, done) {
  /*
    Instead of user this function usually recives the id 
    then you use the id to select the user from the db and pass the user obj to the done callback
    PS: You can later access this data in any routes in: req.user
    */
  const user = await User.findOne({ gId: id });

  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_ID_SECRET,

      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      console.log("it is working");
      console.log(profile);
      const user = await User.findOne({ gId: profile.id });
      if (!user) {
        const user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          username: profile.emails[0].value.slice(
            0,
            profile.emails[0].value.indexOf("@")
          ),
          gId: profile.id,
          ProfilePic: profile.photos[0].value,
        });

        console.log("User is being created");
        return done(null, user);
      } else {
        console.log("it is still working");
        console.log(user);

        return done(null, user);
      }
    }
  )
);
