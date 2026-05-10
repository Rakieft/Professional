const db = require("../config/db");

function isManagerRole(roleName = "") {
  return ["admin", "operations_manager", "project_manager"].includes(roleName);
}

async function listTasks(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};
    const isManager = isManagerRole(sessionUser.roleName);
    const whereClause = isManager ? "" : "WHERE t.assignee_user_id = ?";
    const params = isManager ? [] : [sessionUser.id];

    const tasks = await db.query(
      `SELECT
        t.id,
        t.project_id AS projectId,
        t.assignee_user_id AS assigneeUserId,
        t.title,
        t.description,
        t.status,
        t.priority,
        DATE_FORMAT(t.due_date, '%Y-%m-%d') AS dueDate,
        p.name AS projectName,
        COALESCE(u.full_name, 'Unassigned') AS assigneeName,
        COALESCE(r.name, 'staff') AS assigneeRole,
        u.job_title AS assigneeJobTitle
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN users u ON u.id = t.assignee_user_id
      LEFT JOIN roles r ON r.id = u.role_id
      ${whereClause}
      ORDER BY
        CASE t.status
          WHEN 'todo' THEN 1
          WHEN 'in_progress' THEN 2
          WHEN 'review' THEN 3
          WHEN 'done' THEN 4
          ELSE 5
        END,
        t.due_date IS NULL,
        t.due_date ASC,
        t.updated_at DESC`,
      params
    );

    res.json({
      ok: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
}

async function createTask(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};

    if (!isManagerRole(sessionUser.roleName)) {
      return res.status(403).json({
        ok: false,
        message: "Seuls admin, operations_manager et project_manager peuvent creer des taches."
      });
    }

    const {
      projectId,
      assigneeUserId,
      title,
      description,
      status = "todo",
      priority = "medium",
      dueDate
    } = req.body;

    if (!title) {
      return res.status(400).json({
        ok: false,
        message: "Task title is required"
      });
    }

    const result = await db.query(
      `INSERT INTO tasks
        (project_id, assignee_user_id, title, description, status, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId || null,
        assigneeUserId || null,
        title,
        description || null,
        status,
        priority,
        dueDate || null
      ]
    );

    res.status(201).json({
      ok: true,
      message: "Task created",
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const sessionUser = req.session?.user || {};
    const isManager = isManagerRole(sessionUser.roleName);

    if (!isManager) {
      const ownedTasks = await db.query(`SELECT id FROM tasks WHERE id = ? AND assignee_user_id = ? LIMIT 1`, [id, sessionUser.id]);

      if (!ownedTasks.length) {
        return res.status(403).json({
          ok: false,
          message: "Vous ne pouvez modifier que vos propres taches."
        });
      }
    }

    const {
      projectId,
      assigneeUserId,
      title,
      description,
      status,
      priority,
      dueDate
    } = req.body;

    if (!title) {
      return res.status(400).json({
        ok: false,
        message: "Task title is required"
      });
    }

    await db.query(
      `UPDATE tasks
       SET
         project_id = ?,
         assignee_user_id = ?,
         title = ?,
         description = ?,
         status = ?,
         priority = ?,
         due_date = ?
       WHERE id = ?`,
      [
        projectId || null,
        assigneeUserId || null,
        title,
        description || null,
        status || "todo",
        priority || "medium",
        dueDate || null,
        id
      ]
    );

    res.json({
      ok: true,
      message: "Task updated"
    });
  } catch (error) {
    next(error);
  }
}

async function updateTaskStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sessionUser = req.session?.user || {};
    const isManager = isManagerRole(sessionUser.roleName);

    if (!status) {
      return res.status(400).json({
        ok: false,
        message: "Status is required"
      });
    }

    if (!isManager) {
      const ownedTasks = await db.query(`SELECT id FROM tasks WHERE id = ? AND assignee_user_id = ? LIMIT 1`, [id, sessionUser.id]);

      if (!ownedTasks.length) {
        return res.status(403).json({
          ok: false,
          message: "Vous ne pouvez changer le statut que de vos propres taches."
        });
      }
    }

    await db.query(`UPDATE tasks SET status = ? WHERE id = ?`, [status, id]);

    res.json({
      ok: true,
      message: "Task status updated"
    });
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const sessionUser = req.session?.user || {};

    if (!isManagerRole(sessionUser.roleName)) {
      return res.status(403).json({
        ok: false,
        message: "Seuls admin, operations_manager et project_manager peuvent supprimer des taches."
      });
    }

    await db.query(`DELETE FROM tasks WHERE id = ?`, [id]);

    res.json({
      ok: true,
      message: "Task deleted"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask
};
