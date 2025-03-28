function ensureUserAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "unauthorized user" });
}

export { ensureUserAuthenticated };
