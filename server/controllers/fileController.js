const db = require("../config/db");
const { hasPermission } = require("../middleware/authMiddleware");
const { createNotifications, getActiveUserIdsByRoles } = require("../services/notificationService");
const { createActivityLog } = require("../services/activityService");

function canManageFiles(sessionUser = {}) {
  return hasPermission(sessionUser, "files", "manage");
}

async function listProjectFiles(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};

    if (!hasPermission(sessionUser, "files", "view_all")) {
      return res.status(403).json({
        ok: false,
        message: "Vous n'avez pas les permissions pour consulter les fichiers."
      });
    }

    const files = await db.query(
      `SELECT
        pf.id,
        pf.project_id AS projectId,
        pf.user_id AS userId,
        pf.file_name AS fileName,
        pf.file_url AS fileUrl,
        pf.file_kind AS fileKind,
        pf.visibility,
        pf.notes,
        DATE_FORMAT(pf.created_at, '%Y-%m-%d %H:%i') AS createdAt,
        p.name AS projectName,
        COALESCE(u.full_name, 'Staff') AS authorName
      FROM project_files pf
      LEFT JOIN projects p ON p.id = pf.project_id
      LEFT JOIN users u ON u.id = pf.user_id
      ORDER BY pf.created_at DESC, pf.id DESC`
    );

    const summary = files.reduce(
      (accumulator, file) => {
        accumulator.total += 1;
        accumulator[file.visibility] = (accumulator[file.visibility] || 0) + 1;
        if (file.fileKind) {
          accumulator.kinds[file.fileKind] = (accumulator.kinds[file.fileKind] || 0) + 1;
        }
        return accumulator;
      },
      {
        total: 0,
        internal: 0,
        client: 0,
        reference: 0,
        kinds: {}
      }
    );

    res.json({
      ok: true,
      data: {
        files,
        summary
      }
    });
  } catch (error) {
    next(error);
  }
}

async function createProjectFile(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};

    if (!canManageFiles(sessionUser)) {
      return res.status(403).json({
        ok: false,
        message: "Vous n'avez pas les permissions pour ajouter un livrable."
      });
    }

    const {
      projectId,
      fileName,
      fileUrl,
      fileKind,
      visibility = "internal",
      notes = ""
    } = req.body;

    if (!projectId || !fileName || !fileUrl) {
      return res.status(400).json({
        ok: false,
        message: "Projet, nom du fichier et lien sont obligatoires."
      });
    }

    const validVisibility = ["internal", "client", "reference"];

    if (!validVisibility.includes(visibility)) {
      return res.status(400).json({
        ok: false,
        message: "Visibilite invalide."
      });
    }

    const projects = await db.query(
      `SELECT id, name FROM projects WHERE id = ? LIMIT 1`,
      [projectId]
    );

    const project = projects[0];

    if (!project) {
      return res.status(404).json({
        ok: false,
        message: "Projet introuvable."
      });
    }

    const result = await db.query(
      `INSERT INTO project_files
        (project_id, user_id, file_name, file_url, file_kind, visibility, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        sessionUser.id || null,
        fileName,
        fileUrl,
        fileKind || null,
        visibility,
        notes || null
      ]
    );

    await createActivityLog(`Nouveau livrable ajoute: ${fileName}`, projectId);

    await createNotifications(
      [
        ...(await getActiveUserIdsByRoles(["admin", "operations_manager", "project_manager"])),
        sessionUser.id || null
      ],
      {
        title: "Nouveau fichier projet",
        message: `Le fichier "${fileName}" a ete ajoute sur le projet "${project.name}".`,
        category: "files",
        linkUrl: "/files"
      }
    );

    res.status(201).json({
      ok: true,
      message: "Livrable ajoute avec succes.",
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updateProjectFile(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};

    if (!canManageFiles(sessionUser)) {
      return res.status(403).json({
        ok: false,
        message: "Vous n'avez pas les permissions pour modifier un livrable."
      });
    }

    const { id } = req.params;
    const {
      projectId,
      fileName,
      fileUrl,
      fileKind,
      visibility = "internal",
      notes = ""
    } = req.body;

    if (!projectId || !fileName || !fileUrl) {
      return res.status(400).json({
        ok: false,
        message: "Projet, nom du fichier et lien sont obligatoires."
      });
    }

    const validVisibility = ["internal", "client", "reference"];

    if (!validVisibility.includes(visibility)) {
      return res.status(400).json({
        ok: false,
        message: "Visibilite invalide."
      });
    }

    const fileRows = await db.query(
      `SELECT id FROM project_files WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!fileRows.length) {
      return res.status(404).json({
        ok: false,
        message: "Fichier introuvable."
      });
    }

    const projects = await db.query(
      `SELECT id, name FROM projects WHERE id = ? LIMIT 1`,
      [projectId]
    );

    const project = projects[0];

    if (!project) {
      return res.status(404).json({
        ok: false,
        message: "Projet introuvable."
      });
    }

    await db.query(
      `UPDATE project_files
       SET
         project_id = ?,
         file_name = ?,
         file_url = ?,
         file_kind = ?,
         visibility = ?,
         notes = ?
       WHERE id = ?`,
      [
        projectId,
        fileName,
        fileUrl,
        fileKind || null,
        visibility,
        notes || null,
        id
      ]
    );

    await createActivityLog(`Livrable mis a jour: ${fileName}`, projectId);

    res.json({
      ok: true,
      message: "Livrable mis a jour avec succes."
    });
  } catch (error) {
    next(error);
  }
}

async function deleteProjectFile(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};

    if (!canManageFiles(sessionUser)) {
      return res.status(403).json({
        ok: false,
        message: "Vous n'avez pas les permissions pour supprimer un livrable."
      });
    }

    const { id } = req.params;
    const files = await db.query(
      `SELECT id, project_id AS projectId, file_name AS fileName
       FROM project_files
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    const file = files[0];

    if (!file) {
      return res.status(404).json({
        ok: false,
        message: "Fichier introuvable."
      });
    }

    await db.query(`DELETE FROM project_files WHERE id = ?`, [id]);
    await createActivityLog(`Livrable supprime: ${file.fileName}`, file.projectId);

    res.json({
      ok: true,
      message: "Livrable supprime avec succes."
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listProjectFiles,
  createProjectFile,
  updateProjectFile,
  deleteProjectFile
};
