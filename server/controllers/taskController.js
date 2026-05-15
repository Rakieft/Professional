const db = require("../config/db");
const {
  createNotifications,
  getActiveUserIdsByRoles
} = require("../services/notificationService");
const { hasPermission } = require("../middleware/authMiddleware");

const validStatuses = ["todo", "in_progress", "review", "done"];
const validPriorities = ["low", "medium", "high"];

function canManageTasks(sessionUser = {}) {
  return hasPermission(sessionUser, "tasks", "manage");
}

function canViewAllTasks(sessionUser = {}) {
  return hasPermission(sessionUser, "tasks", "view_all");
}

function canChangeAnyTaskStatus(sessionUser = {}) {
  return hasPermission(sessionUser, "tasks", "change_status_all");
}

function formatActivityDate(date) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

function buildTaskActivity(task, comments = [], files = []) {
  const events = [
    {
      type: "system",
      title: "Tache creee",
      message: `La tache "${task.title}" a ete creee.`,
      createdAt: formatActivityDate(task.createdAt),
      sortValue: new Date(task.createdAt).getTime()
    }
  ];

  if (task.updatedAt && task.updatedAt !== task.createdAt) {
    events.push({
      type: "system",
      title: "Derniere mise a jour",
      message: "La tache a recu une mise a jour de contenu ou d'attribution.",
      createdAt: formatActivityDate(task.updatedAt),
      sortValue: new Date(task.updatedAt).getTime()
    });
  }

  comments.forEach((comment) => {
    events.push({
      type: "comment",
      title: "Commentaire ajoute",
      message: `${comment.authorName}: ${comment.message}`,
      createdAt: comment.createdAt,
      sortValue: Number(comment.createdAtTs || 0) * 1000
    });
  });

  files.forEach((file) => {
    events.push({
      type: "file",
      title: "Fichier rattache",
      message: `${file.authorName} a ajoute "${file.fileName}".`,
      createdAt: file.createdAt,
      sortValue: Number(file.createdAtTs || 0) * 1000
    });
  });

  return events
    .sort((left, right) => right.sortValue - left.sortValue)
    .map(({ sortValue, ...event }) => event);
}

async function logProjectActivity(projectId, message) {
  if (!projectId || !message) {
    return;
  }

  await db.query(
    `INSERT INTO activity_logs (project_id, message, happened_at)
     VALUES (?, ?, NOW())`,
    [projectId, message]
  );
}

async function canAccessTask(taskId, sessionUser = {}) {
  if (canViewAllTasks(sessionUser)) {
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
    const canViewAll = canViewAllTasks(sessionUser);
    const whereClause = canViewAll ? "" : "WHERE t.assignee_user_id = ?";
    const params = canViewAll ? [] : [sessionUser.id];

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
        t.created_at AS createdAt,
        t.updated_at AS updatedAt,
        p.name AS projectName,
        COALESCE(u.full_name, 'Unassigned') AS assigneeName,
        COALESCE(r.name, 'staff') AS assigneeRole,
        u.job_title AS assigneeJobTitle,
        CASE
          WHEN t.due_date IS NOT NULL AND t.due_date < CURDATE() AND t.status <> 'done' THEN 1
          ELSE 0
        END AS isOverdue,
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
          t.created_at AS createdAt,
          t.updated_at AS updatedAt,
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
          UNIX_TIMESTAMP(tc.created_at) AS createdAtTs,
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
          UNIX_TIMESTAMP(tf.created_at) AS createdAtTs,
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
        files,
        activity: buildTaskActivity(tasks[0], comments, files)
      }
    });
  } catch (error) {
    next(error);
  }
}

async function createTask(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};

    if (!canManageTasks(sessionUser)) {
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

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: "Statut invalide"
      });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        ok: false,
        message: "Priorite invalide"
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

    await logProjectActivity(projectId, `Nouvelle tache creee: ${title}`);

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
    if (!canManageTasks(sessionUser)) {
      return res.status(403).json({
        ok: false,
        message: "La modification complete d'une tache est reservee aux roles manageriaux."
      });
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

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: "Statut invalide"
      });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        ok: false,
        message: "Priorite invalide"
      });
    }

    const taskRows = await db.query(
      `SELECT project_id AS projectId, title FROM tasks WHERE id = ? LIMIT 1`,
      [id]
    );

    const task = taskRows[0];

    if (!task) {
      return res.status(404).json({
        ok: false,
        message: "Tache introuvable"
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

    await logProjectActivity(projectId || task.projectId, `Tache mise a jour: ${title}`);

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

    if (!status) {
      return res.status(400).json({
        ok: false,
        message: "Status is required"
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: "Statut invalide"
      });
    }

    if (!canChangeAnyTaskStatus(sessionUser)) {
      const ownedTasks = await db.query(`SELECT id FROM tasks WHERE id = ? AND assignee_user_id = ? LIMIT 1`, [id, sessionUser.id]);

      if (!ownedTasks.length) {
        return res.status(403).json({
          ok: false,
          message: "Vous ne pouvez changer le statut que de vos propres taches."
        });
      }
    }

    await db.query(`UPDATE tasks SET status = ? WHERE id = ?`, [status, id]);

    const taskRows = await db.query(`SELECT title, project_id AS projectId, assignee_user_id AS assigneeUserId FROM tasks WHERE id = ? LIMIT 1`, [id]);
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

      await logProjectActivity(task.projectId, `Statut de tache mis a jour: ${task.title} -> ${status}`);
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
      `SELECT title, project_id AS projectId, assignee_user_id AS assigneeUserId FROM tasks WHERE id = ? LIMIT 1`,
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

      await logProjectActivity(task.projectId, `Commentaire ajoute sur la tache: ${task.title}`);
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
      `SELECT title, project_id AS projectId, assignee_user_id AS assigneeUserId FROM tasks WHERE id = ? LIMIT 1`,
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

      await logProjectActivity(task.projectId, `Fichier ajoute sur la tache: ${task.title}`);
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

    if (!canManageTasks(sessionUser)) {
      return res.status(403).json({
        ok: false,
        message: "Seuls admin, operations_manager et project_manager peuvent supprimer des taches."
      });
    }

    const taskRows = await db.query(
      `SELECT project_id AS projectId, title FROM tasks WHERE id = ? LIMIT 1`,
      [id]
    );

    const task = taskRows[0];

    await db.query(`DELETE FROM tasks WHERE id = ?`, [id]);

    if (task) {
      await logProjectActivity(task.projectId, `Tache supprimee: ${task.title}`);
    }

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
