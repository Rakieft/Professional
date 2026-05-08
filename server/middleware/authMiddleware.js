function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      ok: false,
      message: "Authentication required"
    });
  }

  return next();
}

function requireStaffPage(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect("/login");
  }

  return next();
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect("/staff");
  }

  return next();
}

module.exports = {
  requireAuth,
  requireStaffPage,
  redirectIfAuthenticated
};
