const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function listUsers(_req, res, next) {
  try {
    const users = await db.query(
      `SELECT
        u.id,
        u.full_name AS fullName,
        u.email,
        u.job_title AS jobTitle,
        u.is_active AS isActive,
        u.created_at AS createdAt,
        r.id AS roleId,
        COALESCE(r.name, 'staff') AS roleName
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      ORDER BY u.is_active DESC, u.full_name ASC`
    );

    res.json({
      ok: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const { fullName, email, password, roleId, jobTitle } = req.body;

    if (!fullName || !email || !password || !roleId) {
      return res.status(400).json({
        ok: false,
        message: "Nom, email, mot de passe et role sont obligatoires"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (role_id, full_name, email, password_hash, job_title)
       VALUES (?, ?, ?, ?, ?)`,
      [roleId, fullName, email, passwordHash, jobTitle || null]
    );

    res.status(201).json({
      ok: true,
      message: "Membre du staff cree",
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        ok: false,
        message: "Cet email existe deja"
      });
    }

    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { fullName, email, password, roleId, jobTitle } = req.body;

    if (!fullName || !email || !roleId) {
      return res.status(400).json({
        ok: false,
        message: "Nom, email et role sont obligatoires"
      });
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);

      await db.query(
        `UPDATE users
         SET role_id = ?, full_name = ?, email = ?, password_hash = ?, job_title = ?
         WHERE id = ?`,
        [roleId, fullName, email, passwordHash, jobTitle || null, id]
      );
    } else {
      await db.query(
        `UPDATE users
         SET role_id = ?, full_name = ?, email = ?, job_title = ?
         WHERE id = ?`,
        [roleId, fullName, email, jobTitle || null, id]
      );
    }

    res.json({
      ok: true,
      message: "Membre du staff mis a jour"
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        ok: false,
        message: "Cet email existe deja"
      });
    }

    next(error);
  }
}

async function toggleUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    await db.query(`UPDATE users SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);

    res.json({
      ok: true,
      message: isActive ? "Compte active" : "Compte desactive"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  toggleUserStatus
};
