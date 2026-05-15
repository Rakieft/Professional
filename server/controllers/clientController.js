const db = require("../config/db");
const { hasPermission } = require("../middleware/authMiddleware");
const { createActivityLog } = require("../services/activityService");

async function listClients(_req, res, next) {
  try {
    const clients = await db.query(
      `SELECT
        id,
        name,
        company_type AS companyType,
        contact_name AS contactName,
        email,
        phone,
        status,
        notes,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS createdAt
      FROM clients
      ORDER BY updated_at DESC, created_at DESC`
    );

    res.json({
      ok: true,
      data: clients
    });
  } catch (error) {
    next(error);
  }
}

async function createClient(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};

    if (!hasPermission(sessionUser, "clients", "manage")) {
      return res.status(403).json({
        ok: false,
        message: "Vous n'avez pas les permissions pour creer un client."
      });
    }

    const {
      name,
      companyType,
      contactName,
      email,
      phone,
      status = "lead",
      notes = ""
    } = req.body;

    if (!name) {
      return res.status(400).json({
        ok: false,
        message: "Client name is required"
      });
    }

    const result = await db.query(
      `INSERT INTO clients
        (name, company_type, contact_name, email, phone, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, companyType || null, contactName || null, email || null, phone || null, status, notes || null]
    );

    await createActivityLog(`Nouveau client cree: ${name}`);

    res.status(201).json({
      ok: true,
      message: "Client created",
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listClients,
  createClient
};
