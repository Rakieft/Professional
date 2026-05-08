const db = require("../config/db");

async function getStaffMeta(_req, res, next) {
  try {
    const [services, users] = await Promise.all([
      db.query(`SELECT id, name FROM services ORDER BY name ASC`),
      db.query(`SELECT id, full_name AS fullName, email FROM users WHERE is_active = 1 ORDER BY full_name ASC`)
    ]);

    res.json({
      ok: true,
      data: {
        services,
        users
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStaffMeta
};
