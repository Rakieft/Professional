const db = require("../config/db");
const {
  createNotifications,
  getActiveUserIdsByRoles
} = require("../services/notificationService");

function isManagerRole(roleName = "") {
  return ["admin", "operations_manager", "project_manager"].includes(roleName);
}

async function canAccessTask(taskId, sessionUser = {}) {
  if (isManagerRole(sessionUser.roleName)) {
    return true;
  }

  const ownedTasks = await db.query(
    `SELECT id FROM tasks WHERE id = ? AND assignee_user_id = ? LIMIT 1`,
    [taskId, sessionUser.id]
  );

  return ownedTasks.length > 0;
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
        u.job_title AS assigneeJobTitle,
        (
          SELECT COUNT(*)
          FROM task_comments tc
          WHERE tc.task_id = t.id
        ) AS commentCount,
        (
          SELECT COUNT(*)
          FROM task_files tf
          WHERE tf.task_id = t.id
        ) AS fileCount
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

async function getTaskDetail(req, res, next) {
  try {
    const { id } = req.params;
    const sessionUser = req.session?.user || {};
    const canAccess = await canAccessTask(id, sessionUser);

    if (!canAccess) {
      return res.status(403).json({
        ok: false,
        message: "Vous ne pouvez voir que vos propres taches."
      });
    }

    const [tasks, comments, files] = await Promise.all([
      db.query(
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
        WHERE t.id = ?
        LIMIT 1`,
        [id]
      ),
      db.query(
        `SELECT
          tc.id,
          tc.message,
          DATE_FORMAT(tc.created_at, '%Y-%m-%d %H:%i') AS createdAt,
          COALESCE(u.full_name, 'Staff') AS authorName,
          COALESCE(r.name, 'staff') AS authorRole
        FROM task_comments tc
        LEFT JOIN users u ON u.id = tc.user_id
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE tc.task_id = ?
        ORDER BY tc.created_at DESC`,
        [id]
      ),
      db.query(
        `SELECT
          tf.id,
          tf.file_name AS fileName,
          tf.file_url AS fileUrl,
          tf.file_kind AS fileKind,
          tf.notes,
          DATE_FORMAT(tf.created_at, '%Y-%m-%d %H:%i') AS createdAt,
          COALESCE(u.full_name, 'Staff') AS authorName
        FROM task_files tf
        LEFT JOIN users u ON u.id = tf.user_id
        WHERE tf.task_id = ?
        ORDER BY tf.created_at DESC`,
        [id]
      )
    ]);

    if (!tasks.length) {
      return res.status(404).json({
        ok: false,
        message: "Tache introuvable"
      });
    }

    res.json({
      ok: true,
      data: {
        task: tasks[0],
        comments,
        files
      }
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

    const recipients = [
      assigneeUserId ? Number(assigneeUserId) : null,
      ...(await getActiveUserIdsByRoles(["admin", "operations_manager", "project_manager"]))
    ];

    await createNotifications(recipients, {
      title: "Nouvelle tache staff",
      message: `La tache "${title}" vient d'etre creee dans WebFy.`,
      category: "tasks",
      linkUrl: "/tasks"
    });

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

    const taskRows = await db.query(`SELECT title, assignee_user_id AS assigneeUserId FROM tasks WHERE id = ? LIMIT 1`, [id]);
    const task = taskRows[0];

    if (task) {
      await createNotifications(
        [
          task.assigneeUserId ? Number(task.assigneeUserId) : null,
          ...(await getActiveUserIdsByRoles(["admin", "operations_manager", "project_manager"]))
        ],
        {
          title: "Statut de tache mis a jour",
          message: `La tache "${task.title}" est maintenant en statut "${status}".`,
          category: "tasks",
          linkUrl: "/tasks"
        }
      );
    }

    res.json({
      ok: true,
      message: "Task status updated"
    });
  } catch (error) {
    next(error);
  }
}

async function addTaskComment(req, res, next) {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const sessionUser = req.session?.user || {};
    const canAccess = await canAccessTask(id, sessionUser);

    if (!canAccess) {
      return res.status(403).json({
        ok: false,
        message: "Vous ne pouvez commenter que vos propres taches."
      });
    }

    if (!message) {
      return res.status(400).json({
        ok: false,
        message: "Le commentaire est obligatoire"
      });
    }

    await db.query(
      `INSERT INTO task_comments (task_id, user_id, message)
       VALUES (?, ?, ?)`,
      [id, sessionUser.id, message]
    );

    const [task] = await db.query(
      `SELECT title, assignee_user_id AS assigneeUserId FROM tasks WHERE id = ? LIMIT 1`,
      [id]
    );

    if (task) {
      await createNotifications(
        [task.assigneeUserId ? Number(task.assigneeUserId) : null],
        {
          title: "Nouveau commentaire sur une tache",
          message: `Un commentaire a ete ajoute sur "${task.title}".`,
          category: "comments",
          linkUrl: "/tasks"
        }
      );
    }

    res.status(201).json({
      ok: true,
      message: "Commentaire ajoute"
    });
  } catch (error) {
    next(error);
  }
}

async function addTaskFile(req, res, next) {
  try {
    const { id } = req.params;
    const { fileName, fileUrl, fileKind, notes } = req.body;
    const sessionUser = req.session?.user || {};
    const canAccess = await canAccessTask(id, sessionUser);

    if (!canAccess) {
      return res.status(403).json({
        ok: false,
        message: "Vous ne pouvez ajouter des fichiers que sur vos propres taches."
      });
    }

    if (!fileName || !fileUrl) {
      return res.status(400).json({
        ok: false,
        message: "Nom du fichier et lien sont obligatoires"
      });
    }

    await db.query(
      `INSERT INTO task_files (task_id, user_id, file_name, file_url, file_kind, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, sessionUser.id, fileName, fileUrl, fileKind || null, notes || null]
    );

    const [task] = await db.query(
      `SELECT title, assignee_user_id AS assigneeUserId FROM tasks WHERE id = ? LIMIT 1`,
      [id]
    );

    if (task) {
      await createNotifications(
        [task.assigneeUserId ? Number(task.assigneeUserId) : null],
        {
          title: "Nouveau fichier sur une tache",
          message: `Le fichier "${fileName}" a ete ajoute sur "${task.title}".`,
          category: "files",
          linkUrl: "/tasks"
        }
      );
    }

    res.status(201).json({
      ok: true,
      message: "Fichier ajoute"
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
  deleteTask,
  getTaskDetail,
  addTaskComment,
  addTaskFile
};
