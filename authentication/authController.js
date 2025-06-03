import passport from "./passportConfig.js";

async function authenticateUser(req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      return res
        .status(401)
        .json({ message: info.message || "Authentication failed" });
    }
    req.session.user = user;
    req.logIn(user, (err) => {
      if (err) return res.status(401).json({ message: "unauthorized user" });
      req.session.user = user;
      next();
    });
  })(req, res, next);
}

function handleLogOut(req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    return res.status(200).json({ redirect: "/" });
  });
}
export { authenticateUser, handleLogOut };
