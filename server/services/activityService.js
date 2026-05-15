const db = require("../config/db");

async function createActivityLog(message, projectId = null) {
  if (!message) {
    return;
  }

  await db.query(
    `INSERT INTO activity_logs (project_id, message, happened_at)
     VALUES (?, ?, NOW())`,
    [projectId || null, message]
  );
}

async function listRecentActivity(limit = 12) {
  const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 12;

  return db.query(
    `SELECT
      a.id,
      a.project_id AS projectId,
      a.message,
      DATE_FORMAT(a.happened_at, '%Y-%m-%d %H:%i') AS happenedAt,
      COALESCE(p.name, 'Activite generale') AS projectName
     FROM activity_logs a
     LEFT JOIN projects p ON p.id = a.project_id
     ORDER BY a.happened_at DESC, a.id DESC
     LIMIT ${safeLimit}`
  );
}

module.exports = {
  createActivityLog,
  listRecentActivity
};
