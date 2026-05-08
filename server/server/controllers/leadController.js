const db = require("../config/db");

async function listLeads(_req, res, next) {
  try {
    const leads = await db.query(
      `SELECT
        id,
        company_name AS companyName,
        contact_name AS contactName,
        email,
        phone,
        need_summary AS needSummary,
        status,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS createdAt
      FROM leads
      ORDER BY created_at DESC`
    );

    res.json({
      ok: true,
      data: leads
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listLeads
};
