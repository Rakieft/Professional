const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function getSession(req, res) {
  res.json({
    ok: true,
    authenticated: Boolean(req.session && req.session.user),
    user: req.session?.user || null
  });
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Email and password are required"
      });
    }

    const users = await db.query(
      `SELECT
        u.id,
        u.full_name AS fullName,
        u.email,
        u.password_hash AS passwordHash,
        COALESCE(r.name, 'staff') AS roleName
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.email = ?
      LIMIT 1`,
      [email]
    );

    const user = users[0];

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        ok: false,
        message: "Invalid credentials"
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({
        ok: false,
        message: "Invalid credentials"
      });
    }

    req.session.user = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      roleName: user.roleName
    };

    return res.json({
      ok: true,
      message: "Login successful",
      user: req.session.user
    });
  } catch (error) {
    return next(error);
  }
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("webfy.sid");
    return res.json({
      ok: true,
      message: "Logged out"
    });
  });
}

module.exports = {
  getSession,
  login,
  logout
};
