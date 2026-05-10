function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      ok: false,
      message: "Authentication required"
    });
  }

  return next();
}

function hasAnyRole(user, allowedRoles = []) {
  if (!user || !allowedRoles.length) {
    return false;
  }

  return allowedRoles.includes(user.roleName);
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        ok: false,
        message: "Authentication required"
      });
    }

    if (!hasAnyRole(req.session.user, allowedRoles)) {
      return res.status(403).json({
        ok: false,
        message: "Insufficient permissions"
      });
    }

    return next();
  };
}

function requireStaffPage(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect("/login");
  }

  return next();
}

function requireStaffRolePage(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect("/login");
    }

    if (!hasAnyRole(req.session.user, allowedRoles)) {
      return res.redirect("/staff");
    }

    return next();
  };
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
  requireStaffRolePage,
  redirectIfAuthenticated,
  hasAnyRole,
  requireRole
};
