const db = require("../config/db");

async function getFreshSessionUser(sessionUser) {
  if (!sessionUser?.id) {
    return null;
  }

  const users = await db.query(
    `SELECT
      u.id,
      u.full_name AS fullName,
      u.email,
      u.is_active AS isActive,
      COALESCE(r.name, 'staff') AS roleName
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE u.id = ?
    LIMIT 1`,
    [sessionUser.id]
  );

  return users[0] || null;
}

async function ensureActiveSession(req, mode = "api") {
  if (!req.session || !req.session.user) {
    return {
      ok: false,
      reason: "missing"
    };
  }

  const freshUser = await getFreshSessionUser(req.session.user);

  if (!freshUser || !freshUser.isActive) {
    if (req.session) {
      req.session.user = null;
    }

    return {
      ok: false,
      reason: "inactive"
    };
  }

  req.session.user = {
    id: freshUser.id,
    fullName: freshUser.fullName,
    email: freshUser.email,
    roleName: freshUser.roleName,
    isActive: Boolean(freshUser.isActive)
  };

  return {
    ok: true,
    user: req.session.user,
    mode
  };
}

function requireAuth(req, res, next) {
  ensureActiveSession(req, "api")
    .then((result) => {
      if (!result.ok) {
        return res.status(401).json({
          ok: false,
          message: "Authentication required"
        });
      }

      return next();
    })
    .catch(next);
}

function hasAnyRole(user, allowedRoles = []) {
  if (!user || !allowedRoles.length) {
    return false;
  }

  return allowedRoles.includes(user.roleName);
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    ensureActiveSession(req, "api")
      .then((result) => {
        if (!result.ok) {
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
      })
      .catch(next);
  };
}

function requireStaffPage(req, res, next) {
  ensureActiveSession(req, "page")
    .then((result) => {
      if (!result.ok) {
        return res.redirect("/login");
      }

      return next();
    })
    .catch(next);
}

function requireStaffRolePage(...allowedRoles) {
  return (req, res, next) => {
    ensureActiveSession(req, "page")
      .then((result) => {
        if (!result.ok) {
          return res.redirect("/login");
        }

        if (!hasAnyRole(req.session.user, allowedRoles)) {
          return res.redirect("/staff");
        }

        return next();
      })
      .catch(next);
  };
}

function redirectIfAuthenticated(req, res, next) {
  ensureActiveSession(req, "page")
    .then((result) => {
      if (result.ok) {
        return res.redirect("/staff");
      }

      return next();
    })
    .catch(next);
}

const staffPermissions = {
  tasks: {
    manage: ["admin", "operations_manager", "project_manager"],
    view_all: ["admin", "operations_manager", "project_manager"],
    change_status_all: ["admin", "operations_manager", "project_manager"]
  },
  clients: {
    manage: [
      "admin",
      "cofounder",
      "secretary",
      "operations_manager",
      "project_manager",
      "sales_manager",
      "support_manager",
      "administrative_assistant"
    ]
  },
  projects: {
    manage: ["admin", "cofounder", "operations_manager", "project_manager"]
  },
  leads: {
    manage: ["admin", "cofounder", "secretary", "operations_manager", "project_manager", "sales_manager", "administrative_assistant"]
  },
  files: {
    manage: [
      "admin",
      "cofounder",
      "secretary",
      "operations_manager",
      "project_manager",
      "designer",
      "developer",
      "content_creator",
      "social_media_manager",
      "sales_manager",
      "support_manager",
      "administrative_assistant"
    ],
    view_all: [
      "admin",
      "cofounder",
      "secretary",
      "operations_manager",
      "project_manager",
      "designer",
      "developer",
      "content_creator",
      "social_media_manager",
      "sales_manager",
      "support_manager",
      "administrative_assistant"
    ]
  },
  analytics: {
    view: ["admin"]
  }
};

function hasPermission(user, moduleName, action) {
  if (!user || !moduleName || !action) {
    return false;
  }

  const allowedRoles = staffPermissions[moduleName]?.[action] || [];
  return allowedRoles.includes(user.roleName);
}

module.exports = {
  requireAuth,
  requireStaffPage,
  requireStaffRolePage,
  redirectIfAuthenticated,
  hasAnyRole,
  requireRole,
  hasPermission,
  ensureActiveSession
};
