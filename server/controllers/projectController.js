const db = require("../config/db");
const { hasPermission } = require("../middleware/authMiddleware");
const { createActivityLog } = require("../services/activityService");

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

async function createProject(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};

    if (!hasPermission(sessionUser, "projects", "manage")) {
      return res.status(403).json({
        ok: false,
        message: "Vous n'avez pas les permissions pour creer un projet."
      });
    }

    const {
      clientId,
      primaryServiceId,
      ownerUserId,
      name,
      description,
      status = "planned",
      priority = "medium",
      budget,
      startDate,
      dueDate
    } = req.body;

    if (!name) {
      return res.status(400).json({
        ok: false,
        message: "Project name is required"
      });
    }

    const result = await db.query(
      `INSERT INTO projects
        (client_id, primary_service_id, owner_user_id, name, description, status, priority, budget, start_date, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientId || null,
        primaryServiceId || null,
        ownerUserId || null,
        name,
        description || null,
        status,
        priority,
        budget || null,
        startDate || null,
        dueDate || null
      ]
    );

    await createActivityLog(`Nouveau projet cree: ${name}`, result.insertId);

    res.status(201).json({
      ok: true,
      message: "Project created",
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listProjects,
  createProject
};
