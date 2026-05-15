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
        u.phone,
        u.whatsapp_phone AS whatsappPhone,
        u.bio,
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
    const { fullName, email, password, roleId, jobTitle, phone, whatsappPhone, bio } = req.body;

    if (!fullName || !email || !password || !roleId) {
      return res.status(400).json({
        ok: false,
        message: "Nom, email, mot de passe et role sont obligatoires"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (role_id, full_name, email, password_hash, job_title, phone, whatsapp_phone, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [roleId, fullName, email, passwordHash, jobTitle || null, phone || null, whatsappPhone || null, bio || null]
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
    const { fullName, email, password, roleId, jobTitle, phone, whatsappPhone, bio } = req.body;

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
         SET role_id = ?, full_name = ?, email = ?, password_hash = ?, job_title = ?, phone = ?, whatsapp_phone = ?, bio = ?
         WHERE id = ?`,
        [roleId, fullName, email, passwordHash, jobTitle || null, phone || null, whatsappPhone || null, bio || null, id]
      );
    } else {
      await db.query(
        `UPDATE users
         SET role_id = ?, full_name = ?, email = ?, job_title = ?, phone = ?, whatsapp_phone = ?, bio = ?
         WHERE id = ?`,
        [roleId, fullName, email, jobTitle || null, phone || null, whatsappPhone || null, bio || null, id]
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

    if (Number(id) === Number(req.session?.user?.id) && !isActive) {
      return res.status(400).json({
        ok: false,
        message: "Vous ne pouvez pas desactiver votre propre compte."
      });
    }

    await db.query(`UPDATE users SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);

    res.json({
      ok: true,
      message: isActive ? "Compte active" : "Compte desactive"
    });
  } catch (error) {
    next(error);
  }
}

async function getMyProfile(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};
    const users = await db.query(
      `SELECT
        u.id,
        u.full_name AS fullName,
        u.email,
        u.job_title AS jobTitle,
        u.phone,
        u.whatsapp_phone AS whatsappPhone,
        u.bio,
        u.is_active AS isActive,
        COALESCE(r.name, 'staff') AS roleName
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
      LIMIT 1`,
      [sessionUser.id]
    );

    if (!users.length) {
      return res.status(404).json({
        ok: false,
        message: "Profil introuvable"
      });
    }

    const [taskStats] = await db.query(
      `SELECT
        SUM(CASE WHEN assignee_user_id = ? THEN 1 ELSE 0 END) AS totalTasks,
        SUM(CASE WHEN assignee_user_id = ? AND status <> 'done' THEN 1 ELSE 0 END) AS openTasks,
        SUM(CASE WHEN assignee_user_id = ? AND status = 'done' THEN 1 ELSE 0 END) AS completedTasks
      FROM tasks`,
      [sessionUser.id, sessionUser.id, sessionUser.id]
    );

    res.json({
      ok: true,
      data: {
        ...users[0],
        stats: {
          totalTasks: Number(taskStats.totalTasks || 0),
          openTasks: Number(taskStats.openTasks || 0),
          completedTasks: Number(taskStats.completedTasks || 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};
    const {
      fullName,
      jobTitle,
      phone,
      whatsappPhone,
      bio,
      password
    } = req.body;

    if (!fullName) {
      return res.status(400).json({
        ok: false,
        message: "Le nom complet est obligatoire"
      });
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await db.query(
        `UPDATE users
         SET full_name = ?, job_title = ?, phone = ?, whatsapp_phone = ?, bio = ?, password_hash = ?
         WHERE id = ?`,
        [fullName, jobTitle || null, phone || null, whatsappPhone || null, bio || null, passwordHash, sessionUser.id]
      );
    } else {
      await db.query(
        `UPDATE users
         SET full_name = ?, job_title = ?, phone = ?, whatsapp_phone = ?, bio = ?
         WHERE id = ?`,
        [fullName, jobTitle || null, phone || null, whatsappPhone || null, bio || null, sessionUser.id]
      );
    }

    req.session.user = {
      ...req.session.user,
      fullName
    };

    res.json({
      ok: true,
      message: "Profil mis a jour"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  getMyProfile,
  updateMyProfile
};
