import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { getUserById, getUserByName } from "../db/user-queries.js";

const verifyUser = async (username, password, done) => {
  try {
    const user = await getUserByName(username);

    if (!user) {
      return done(null, false, { message: "user not found." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
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
    { usernameField: "logInUserName", passwordField: "logInUserPassword" },
    verifyUser
  )
);
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

export default passport;
