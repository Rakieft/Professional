const db = require("../config/db");

const ALLOWED_MODELS = new Set([
  "volunteer",
  "monthly_salary",
  "project_based",
  "stipend"
]);

const MODEL_LABELS = {
  volunteer: "Benevole",
  monthly_salary: "Salaire mensuel",
  project_based: "Paiement par mission",
  stipend: "Prime / support"
};

function formatMoney(amount, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function buildExecutiveAlerts(rows = [], summary) {
  const alerts = [];
  const unpaidCriticalRoles = rows.filter((row) =>
    ["developer", "designer", "project_manager"].includes(row.roleName) &&
    row.isActive === 1 &&
    row.compensationModel === "volunteer"
  );

  if (unpaidCriticalRoles.length) {
    alerts.push({
      title: "Roles critiques encore benevoles",
      text: `${unpaidCriticalRoles.length} poste(s) cle(s) tournent encore en benevolat. A surveiller si la charge monte.`
    });
  }

  const inactivePaid = rows.filter((row) =>
    row.isActive !== 1 &&
    row.compensationModel !== "volunteer" &&
    Number(row.amount || 0) > 0
  );

  if (inactivePaid.length) {
    alerts.push({
      title: "Comptes inactifs avec cout actif",
      text: `${inactivePaid.length} membre(s) ont une remuneration definie alors que leur compte est inactif.`
    });
  }

  if ((summary.netCashFlow || 0) < 0) {
    alerts.push({
      title: "Cash flow negatif",
      text: `Le cash flow estime est actuellement de ${formatMoney(summary.netCashFlow || 0)}. Il faut proteger les encaissements ou reduire les engagements.`
    });
  }

  if ((summary.grossMargin || 0) < 0) {
    alerts.push({
      title: "Marge estimee negative",
      text: `La marge estimee passe sous zero a ${formatMoney(summary.grossMargin || 0)}. Le pilotage CEO doit reajuster les couts ou les revenus.`
    });
  }

  if (!alerts.length) {
    alerts.push({
      title: "Structure saine",
      text: `La vue CEO montre ${summary.activeStaffCount} compte(s) actif(s) pour ${summary.paidStaffCount} poste(s) remunere(s).`
    });
  }

  return alerts;
}

async function getExecutiveAnalytics(_req, res, next) {
  try {
    const [staffRows, projectStats, taskStats, leadStats, quoteStats, paymentStats] = await Promise.all([
      db.query(
        `SELECT
          u.id,
          u.full_name AS fullName,
          u.email,
          u.job_title AS jobTitle,
          u.is_active AS isActive,
          COALESCE(r.name, 'staff') AS roleName,
          COALESCE(sc.compensation_model, 'volunteer') AS compensationModel,
          COALESCE(sc.amount, 0) AS amount,
          COALESCE(sc.currency, 'USD') AS currency,
          sc.notes,
          sc.updated_at AS compensationUpdatedAt
        FROM users u
        LEFT JOIN roles r ON r.id = u.role_id
        LEFT JOIN staff_compensation sc ON sc.user_id = u.id
        ORDER BY u.is_active DESC, u.full_name ASC`
      ),
      db.query(
        `SELECT
          SUM(CASE WHEN status IN ('planned', 'in_progress', 'review') THEN 1 ELSE 0 END) AS activeProjects,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS deliveredProjects
        FROM projects`
      ),
      db.query(
        `SELECT
          SUM(CASE WHEN status <> 'done' THEN 1 ELSE 0 END) AS openTasks,
          SUM(CASE WHEN due_date IS NOT NULL AND due_date < CURDATE() AND status <> 'done' THEN 1 ELSE 0 END) AS overdueTasks
        FROM tasks`
      ),
      db.query(
        `SELECT
          SUM(CASE WHEN status IN ('new', 'contacted', 'qualified') THEN 1 ELSE 0 END) AS pipelineLeads,
          SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) AS wonLeads
        FROM leads`
      ),
      db.query(
        `SELECT
          SUM(CASE WHEN status = 'accepted' THEN amount ELSE 0 END) AS acceptedRevenue,
          SUM(CASE WHEN status IN ('draft', 'sent') THEN amount ELSE 0 END) AS openQuotes
        FROM quotes`
      ),
      db.query(
        `SELECT
          SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END) AS receivedRevenue,
          SUM(CASE WHEN payment_status IN ('pending', 'partial') THEN amount ELSE 0 END) AS pendingRevenue
        FROM payment_records`
      )
    ]);

    const summary = staffRows.reduce((acc, row) => {
      const amount = Number(row.amount || 0);
      const model = row.compensationModel || "volunteer";

      acc.activeStaffCount += Number(row.isActive) === 1 ? 1 : 0;

      if (model === "volunteer") {
        acc.volunteerCount += 1;
      } else if (amount > 0) {
        acc.paidStaffCount += 1;
      }

      if (model === "monthly_salary") {
        acc.monthlyPayroll += amount;
        acc.salaryHolders += 1;
      }

      if (model === "stipend") {
        acc.supportBudget += amount;
      }

      if (model === "project_based") {
        acc.projectCommitment += amount;
      }

      return acc;
    }, {
      activeStaffCount: 0,
      volunteerCount: 0,
      paidStaffCount: 0,
      monthlyPayroll: 0,
      supportBudget: 0,
      projectCommitment: 0,
      salaryHolders: 0
    });

    const projectRow = projectStats[0] || {};
    const taskRow = taskStats[0] || {};
    const leadRow = leadStats[0] || {};
    const quoteRow = quoteStats[0] || {};
    const paymentRow = paymentStats[0] || {};

    const responseRows = staffRows.map((row) => ({
      ...row,
      amount: Number(row.amount || 0),
      compensationLabel: MODEL_LABELS[row.compensationModel] || "A definir",
      amountLabel: Number(row.amount || 0) > 0 ? formatMoney(row.amount, row.currency) : "A definir"
    }));

    const fixedCostBase = summary.monthlyPayroll + summary.supportBudget + summary.projectCommitment;
    const receivedRevenue = Number(paymentRow.receivedRevenue || 0);
    const pendingRevenue = Number(paymentRow.pendingRevenue || 0);
    const netCashFlow = receivedRevenue - fixedCostBase;
    const grossMargin = receivedRevenue - fixedCostBase;
    const profitabilityRate = receivedRevenue > 0 ? (grossMargin / receivedRevenue) * 100 : 0;

    res.json({
      ok: true,
      data: {
        summary: {
          ...summary,
          averageSalary: summary.salaryHolders ? summary.monthlyPayroll / summary.salaryHolders : 0,
          activeProjects: Number(projectRow.activeProjects || 0),
          deliveredProjects: Number(projectRow.deliveredProjects || 0),
          openTasks: Number(taskRow.openTasks || 0),
          overdueTasks: Number(taskRow.overdueTasks || 0),
          pipelineLeads: Number(leadRow.pipelineLeads || 0),
          wonLeads: Number(leadRow.wonLeads || 0),
          acceptedRevenue: Number(quoteRow.acceptedRevenue || 0),
          openQuotes: Number(quoteRow.openQuotes || 0),
          receivedRevenue: Number(paymentRow.receivedRevenue || 0),
          pendingRevenue: Number(paymentRow.pendingRevenue || 0),
          fixedCostBase,
          netCashFlow,
          grossMargin,
          profitabilityRate,
          acceptedRevenueLabel: formatMoney(quoteRow.acceptedRevenue || 0),
          openQuotesLabel: formatMoney(quoteRow.openQuotes || 0),
          receivedRevenueLabel: formatMoney(paymentRow.receivedRevenue || 0),
          pendingRevenueLabel: formatMoney(paymentRow.pendingRevenue || 0),
          fixedCostBaseLabel: formatMoney(fixedCostBase),
          netCashFlowLabel: formatMoney(netCashFlow),
          grossMarginLabel: formatMoney(grossMargin),
          profitabilityRateLabel: `${profitabilityRate.toFixed(0)}%`
        },
        staff: responseRows,
        alerts: buildExecutiveAlerts(responseRows, { ...summary, netCashFlow, grossMargin }),
        modelLabels: MODEL_LABELS
      }
    });
  } catch (error) {
    next(error);
  }
}

async function upsertCompensation(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    const {
      compensationModel,
      amount,
      currency,
      notes
    } = req.body;

    if (!userId || !ALLOWED_MODELS.has(compensationModel)) {
      return res.status(400).json({
        ok: false,
        message: "Modele de remuneration invalide"
      });
    }

    const normalizedAmount = amount === "" || amount === null || typeof amount === "undefined"
      ? 0
      : Number(amount);

    if (Number.isNaN(normalizedAmount) || normalizedAmount < 0) {
      return res.status(400).json({
        ok: false,
        message: "Montant invalide"
      });
    }

    const users = await db.query(`SELECT id FROM users WHERE id = ? LIMIT 1`, [userId]);

    if (!users.length) {
      return res.status(404).json({
        ok: false,
        message: "Membre introuvable"
      });
    }

    await db.query(
      `INSERT INTO staff_compensation (user_id, compensation_model, amount, currency, notes)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         compensation_model = VALUES(compensation_model),
         amount = VALUES(amount),
         currency = VALUES(currency),
         notes = VALUES(notes)`,
      [
        userId,
        compensationModel,
        normalizedAmount,
        (currency || "USD").trim() || "USD",
        notes || null
      ]
    );

    res.json({
      ok: true,
      message: "Remuneration mise a jour"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getExecutiveAnalytics,
  upsertCompensation
};
