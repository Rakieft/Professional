const db = require("../config/db");

async function listTasks(_req, res, next) {
  try {
    const tasks = await db.query(
      `SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        DATE_FORMAT(t.due_date, '%Y-%m-%d') AS dueDate,
        p.name AS projectName,
        COALESCE(u.full_name, 'Unassigned') AS assigneeName
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN users u ON u.id = t.assignee_user_id
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
        t.updated_at DESC`
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

module.exports = {
  listTasks,
  createTask
};
