const db = require("../config/db");
const { hasAnyRole } = require("../middleware/authMiddleware");

async function listNotifications(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};
    const isManager = hasAnyRole(sessionUser, ["admin", "operations_manager", "project_manager"]);
    const category = req.query.category || "";
    const params = isManager ? [] : [sessionUser.id];
    const clauses = [];

    if (!isManager) {
      clauses.push("n.user_id = ?");
    }

    if (category) {
      clauses.push("n.category = ?");
      params.push(category);
    }

    const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

    const notifications = await db.query(
      `SELECT
        n.id,
        n.title,
        n.message,
        n.category,
        n.link_url AS linkUrl,
        n.is_read AS isRead,
        DATE_FORMAT(n.created_at, '%Y-%m-%d %H:%i') AS createdAt,
        COALESCE(u.full_name, 'Staff') AS targetName
      FROM notifications n
      LEFT JOIN users u ON u.id = n.user_id
      ${whereClause}
      ORDER BY n.is_read ASC, n.created_at DESC
      LIMIT 50`,
      params
    );

    const unread = notifications.filter((notification) => Number(notification.isRead) !== 1).length;
    const categorySummary = notifications.reduce((acc, notification) => {
      const key = notification.category || "general";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    res.json({
      ok: true,
      data: {
        unread,
        categories: categorySummary,
        notifications
      }
    });
  } catch (error) {
    next(error);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};
    const { id } = req.params;
    const isManager = hasAnyRole(sessionUser, ["admin", "operations_manager", "project_manager"]);

    const notifications = await db.query(
      `SELECT id, user_id AS userId FROM notifications WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!notifications.length) {
      return res.status(404).json({
        ok: false,
        message: "Notification introuvable"
      });
    }

    const notification = notifications[0];

    if (!isManager && Number(notification.userId) !== Number(sessionUser.id)) {
      return res.status(403).json({
        ok: false,
        message: "Vous ne pouvez pas modifier cette notification"
      });
    }

    await db.query(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);

    res.json({
      ok: true,
      message: "Notification marquee comme lue"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listNotifications,
  markNotificationRead
};
