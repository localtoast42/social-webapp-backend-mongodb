export function isAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.status(401).json({ success: false, msg: "Unauthorized" });
}