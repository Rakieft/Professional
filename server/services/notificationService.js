const db = require("../config/db");

async function getActiveUserIdsByRoles(roleNames = []) {
  if (!roleNames.length) {
    return [];
  }

  const placeholders = roleNames.map(() => "?").join(", ");
  const rows = await db.query(
    `SELECT u.id
     FROM users u
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE u.is_active = 1
       AND r.name IN (${placeholders})`,
    roleNames
  );

  return rows.map((row) => row.id);
}

async function createNotifications(userIds = [], payload = {}) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

  if (!uniqueUserIds.length || !payload.title || !payload.message) {
    return;
  }

  const values = uniqueUserIds.map(() => "(?, ?, ?, ?, ?)").join(", ");
  const params = [];

  uniqueUserIds.forEach((userId) => {
    params.push(
      userId,
      payload.title,
      payload.message,
      payload.category || "general",
      payload.linkUrl || null
    );
  });

  await db.query(
    `INSERT INTO notifications (user_id, title, message, category, link_url)
     VALUES ${values}`,
    params
  );
}

module.exports = {
  getActiveUserIdsByRoles,
  createNotifications
};
