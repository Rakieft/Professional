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

function formatPercent(value) {
  return `${Number(value || 0).toFixed(0)}%`;
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

  if ((summary.overduePressureRate || 0) >= 35) {
    alerts.push({
      title: "Pression operationnelle elevee",
      text: `${summary.overdueTasks || 0} tache(s) en retard sur ${summary.openTasks || 0} ouvertes. Le delivery commence a perdre du rythme.`
    });
  }

  if ((summary.leadWinRate || 0) < 25 && (summary.totalQualifiedLeads || 0) >= 4) {
    alerts.push({
      title: "Conversion commerciale fragile",
      text: `Le taux de conversion lead vers gagne reste a ${formatPercent(summary.leadWinRate)}. Il faut revoir relances, offres ou qualification.`
    });
  }

  if ((summary.quoteCoverageRate || 0) < 45 && (summary.openQuotes || 0) > 0) {
    alerts.push({
      title: "Devis encore peu transformes",
      text: `${summary.acceptedRevenueLabel} signes pour ${summary.openQuotesLabel} encore ouverts. Le pipe devis doit mieux convertir.`
    });
  }

  if ((summary.volunteerRatio || 0) > 50) {
    alerts.push({
      title: "Dependance forte au benevolat",
      text: `${summary.volunteerCount || 0} membre(s) sur ${summary.totalStaff || 0} restent benevoles. Le risque augmente si l'activite accelere.`
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
          COUNT(*) AS totalProjects,
          SUM(CASE WHEN status IN ('planned', 'in_progress', 'review') THEN 1 ELSE 0 END) AS activeProjects,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS deliveredProjects,
          SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) AS reviewProjects
        FROM projects`
      ),
      db.query(
        `SELECT
          COUNT(*) AS totalTasks,
          SUM(CASE WHEN status <> 'done' THEN 1 ELSE 0 END) AS openTasks,
          SUM(CASE WHEN due_date IS NOT NULL AND due_date < CURDATE() AND status <> 'done' THEN 1 ELSE 0 END) AS overdueTasks,
          SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS completedTasks
        FROM tasks`
      ),
      db.query(
        `SELECT
          COUNT(*) AS totalLeads,
          SUM(CASE WHEN status IN ('new', 'contacted', 'qualified') THEN 1 ELSE 0 END) AS pipelineLeads,
          SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) AS qualifiedLeads,
          SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) AS wonLeads,
          SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) AS lostLeads
        FROM leads`
      ),
      db.query(
        `SELECT
          COUNT(*) AS totalQuotes,
          SUM(CASE WHEN status = 'accepted' THEN amount ELSE 0 END) AS acceptedRevenue,
          SUM(CASE WHEN status IN ('draft', 'sent') THEN amount ELSE 0 END) AS openQuotes,
          SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS acceptedQuotes,
          SUM(CASE WHEN status IN ('draft', 'sent') THEN 1 ELSE 0 END) AS openQuoteCount
        FROM quotes`
      ),
      db.query(
        `SELECT
          SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END) AS receivedRevenue,
          SUM(CASE WHEN payment_status IN ('pending', 'partial') THEN amount ELSE 0 END) AS pendingRevenue,
          SUM(CASE WHEN payment_status = 'paid' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN amount ELSE 0 END) AS thisMonthRevenue
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
    const thisMonthRevenue = Number(paymentRow.thisMonthRevenue || 0);
    const netCashFlow = receivedRevenue - fixedCostBase;
    const grossMargin = receivedRevenue - fixedCostBase;
    const profitabilityRate = receivedRevenue > 0 ? (grossMargin / receivedRevenue) * 100 : 0;
    const totalProjects = Number(projectRow.totalProjects || 0);
    const totalTasks = Number(taskRow.totalTasks || 0);
    const openTasks = Number(taskRow.openTasks || 0);
    const overdueTasks = Number(taskRow.overdueTasks || 0);
    const completedTasks = Number(taskRow.completedTasks || 0);
    const totalLeads = Number(leadRow.totalLeads || 0);
    const qualifiedLeads = Number(leadRow.qualifiedLeads || 0);
    const wonLeads = Number(leadRow.wonLeads || 0);
    const lostLeads = Number(leadRow.lostLeads || 0);
    const openQuotes = Number(quoteRow.openQuotes || 0);
    const acceptedRevenue = Number(quoteRow.acceptedRevenue || 0);
    const totalStaff = responseRows.length;
    const volunteerRatio = totalStaff > 0 ? (summary.volunteerCount / totalStaff) * 100 : 0;
    const paidRatio = totalStaff > 0 ? (summary.paidStaffCount / totalStaff) * 100 : 0;
    const deliveryRate = totalProjects > 0 ? (Number(projectRow.deliveredProjects || 0) / totalProjects) * 100 : 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const overduePressureRate = openTasks > 0 ? (overdueTasks / openTasks) * 100 : 0;
    const totalQualifiedLeads = qualifiedLeads + wonLeads + lostLeads;
    const leadWinRate = totalQualifiedLeads > 0 ? (wonLeads / totalQualifiedLeads) * 100 : 0;
    const quoteCoverageRate = openQuotes > 0 ? (acceptedRevenue / openQuotes) * 100 : acceptedRevenue > 0 ? 100 : 0;
    const costCoverageRate = fixedCostBase > 0 ? (receivedRevenue / fixedCostBase) * 100 : 100;
    const runwayLabel = fixedCostBase === 0
      ? "Lean"
      : costCoverageRate >= 120
        ? "Confortable"
        : costCoverageRate >= 85
          ? "A surveiller"
          : "Fragile";
    const decisionCards = [
      {
        title: "Priorite cash",
        label: netCashFlow >= 0 ? "stable" : "urgent",
        text: fixedCostBase === 0
          ? `La structure reste tres legere pour le moment. C'est le bon moment pour signer sans alourdir trop vite les couts fixes.`
          : netCashFlow >= 0
            ? `Le cash couvre actuellement la base de cout a ${formatPercent(costCoverageRate)}. Gardez le rythme d'encaissement.`
            : `Le cash ne couvre pas encore la base de cout. Il manque ${formatMoney(Math.abs(netCashFlow))} pour respirer.`
      },
      {
        title: "Priorite delivery",
        label: overduePressureRate >= 35 ? "attention" : "maitrise",
        text: overduePressureRate >= 35
          ? `La pression delivery est haute avec ${formatPercent(overduePressureRate)} de taches ouvertes en retard.`
          : `Le delivery reste tenable avec ${formatPercent(completionRate)} des taches deja bouclees.`
      },
      {
        title: "Priorite equipe",
        label: volunteerRatio > 50 ? "risque" : "equilibre",
        text: volunteerRatio > 50
          ? `${formatPercent(volunteerRatio)} du staff reste benevole. Anticipez les roles a basculer vers une remuneration.`
          : `L'equipe est plus equilibree avec ${summary.paidStaffCount} poste(s) remunere(s) sur ${totalStaff}.`
      }
    ];
    const ceoFocus = [
      {
        title: "Croissance commerciale",
        value: formatPercent(leadWinRate),
        caption: `${wonLeads} lead(s) gagnes sur ${totalQualifiedLeads || totalLeads} exploitable(s)`
      },
      {
        title: "Execution projet",
        value: formatPercent(deliveryRate),
        caption: `${projectRow.deliveredProjects || 0} projet(s) livres sur ${totalProjects}`
      },
      {
        title: "Couverture du pipe",
        value: formatPercent(quoteCoverageRate),
        caption: `${formatMoney(acceptedRevenue)} signes face a ${formatMoney(openQuotes)} encore en devis`
      },
      {
        title: "Capacite equipe",
        value: formatPercent(100 - overduePressureRate),
        caption: `${summary.activeStaffCount} compte(s) actif(s), niveau ${runwayLabel.toLowerCase()}`
      }
    ];

    res.json({
      ok: true,
      data: {
        build: "ceo-final-v2",
        summary: {
          ...summary,
          averageSalary: summary.salaryHolders ? summary.monthlyPayroll / summary.salaryHolders : 0,
          totalStaff,
          activeProjects: Number(projectRow.activeProjects || 0),
          deliveredProjects: Number(projectRow.deliveredProjects || 0),
          reviewProjects: Number(projectRow.reviewProjects || 0),
          totalProjects,
          totalTasks,
          openTasks,
          overdueTasks,
          completedTasks,
          pipelineLeads: Number(leadRow.pipelineLeads || 0),
          qualifiedLeads,
          wonLeads,
          lostLeads,
          totalLeads,
          totalQualifiedLeads,
          acceptedRevenue,
          openQuotes,
          receivedRevenue,
          pendingRevenue,
          thisMonthRevenue,
          fixedCostBase,
          netCashFlow,
          grossMargin,
          profitabilityRate,
          volunteerRatio,
          paidRatio,
          deliveryRate,
          completionRate,
          overduePressureRate,
          leadWinRate,
          quoteCoverageRate,
          costCoverageRate,
          runwayLabel,
          acceptedRevenueLabel: formatMoney(acceptedRevenue),
          openQuotesLabel: formatMoney(openQuotes),
          receivedRevenueLabel: formatMoney(receivedRevenue),
          pendingRevenueLabel: formatMoney(pendingRevenue),
          thisMonthRevenueLabel: formatMoney(thisMonthRevenue),
          fixedCostBaseLabel: formatMoney(fixedCostBase),
          netCashFlowLabel: formatMoney(netCashFlow),
          grossMarginLabel: formatMoney(grossMargin),
          profitabilityRateLabel: formatPercent(profitabilityRate),
          volunteerRatioLabel: formatPercent(volunteerRatio),
          paidRatioLabel: formatPercent(paidRatio),
          deliveryRateLabel: formatPercent(deliveryRate),
          completionRateLabel: formatPercent(completionRate),
          overduePressureRateLabel: formatPercent(overduePressureRate),
          leadWinRateLabel: formatPercent(leadWinRate),
          quoteCoverageRateLabel: formatPercent(quoteCoverageRate),
          costCoverageRateLabel: formatPercent(costCoverageRate)
        },
        staff: responseRows,
        alerts: buildExecutiveAlerts(responseRows, {
          ...summary,
          totalStaff,
          totalQualifiedLeads,
          openTasks,
          overdueTasks,
          openQuotes,
          acceptedRevenueLabel: formatMoney(acceptedRevenue),
          openQuotesLabel: formatMoney(openQuotes),
          netCashFlow,
          grossMargin,
          volunteerRatio,
          overduePressureRate,
          leadWinRate
        }),
        decisionCards,
        ceoFocus,
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
