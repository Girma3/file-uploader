import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";

const verifyUser = async (userName, userPassword, done) => {
  try {
    const user = "";
    if (!user) {
      return done(null, false, { message: "user not found." });
    }
    const isMatch = await bcrypt.compare(userPassword, user.password);
    if (!isMatch) {
      return done(null, false, { message: "password was incorrect." });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

passport.use(
  new LocalStrategy(
    { usernameField: "logInUserName", passwordField: "logInPassword" },
    verifyUser
  )
);
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = "";
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

export default passport;
