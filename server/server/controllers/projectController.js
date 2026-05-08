const db = require("../config/db");

async function listProjects(_req, res, next) {
  try {
    const projects = await db.query(
      `SELECT
        p.id,
        p.name,
        p.status,
        p.priority,
        c.name AS clientName,
        COALESCE(u.full_name, 'Unassigned') AS ownerName,
        DATE_FORMAT(p.start_date, '%Y-%m-%d') AS startDate,
        DATE_FORMAT(p.due_date, '%Y-%m-%d') AS dueDate
      FROM projects p
      LEFT JOIN clients c ON c.id = p.client_id
      LEFT JOIN users u ON u.id = p.owner_user_id
      ORDER BY p.updated_at DESC`
    );

    res.json({
      ok: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listProjects
};
