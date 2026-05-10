const db = require("../config/db");
const {
  createNotifications,
  getActiveUserIdsByRoles
} = require("../services/notificationService");

function canManageFinance(roleName = "") {
  return ["admin", "operations_manager", "project_manager", "sales_manager"].includes(roleName);
}

function formatMoney(amount, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

async function getFinanceOverview(_req, res, next) {
  try {
    const [quotes, payments, clients, projects, invoices] = await Promise.all([
      db.query(
        `SELECT
          q.id,
          q.project_type AS projectType,
          q.amount,
          q.status,
          q.notes,
          DATE_FORMAT(q.created_at, '%Y-%m-%d') AS createdAt,
          c.name AS clientName
        FROM quotes q
        LEFT JOIN clients c ON c.id = q.client_id
        ORDER BY q.updated_at DESC, q.created_at DESC`
      ),
      db.query(
        `SELECT
          pr.id,
          pr.title,
          pr.amount,
          pr.currency,
          pr.payment_method AS paymentMethod,
          pr.payment_status AS paymentStatus,
          DATE_FORMAT(pr.payment_date, '%Y-%m-%d') AS paymentDate,
          pr.notes,
          c.name AS clientName,
          p.name AS projectName
        FROM payment_records pr
        LEFT JOIN clients c ON c.id = pr.client_id
        LEFT JOIN projects p ON p.id = pr.project_id
        ORDER BY pr.payment_date DESC, pr.created_at DESC`
      ),
      db.query(`SELECT id, name FROM clients ORDER BY name ASC`),
      db.query(`SELECT id, name FROM projects ORDER BY name ASC`),
      db.query(
        `SELECT
          i.id,
          i.invoice_number AS invoiceNumber,
          i.title,
          i.amount,
          i.currency,
          i.status,
          DATE_FORMAT(i.issued_date, '%Y-%m-%d') AS issuedDate,
          DATE_FORMAT(i.due_date, '%Y-%m-%d') AS dueDate,
          c.name AS clientName
        FROM invoices i
        LEFT JOIN clients c ON c.id = i.client_id
        ORDER BY i.created_at DESC`
      )
    ]);

    const summary = {
      totalQuoted: 0,
      acceptedQuoted: 0,
      pendingQuoted: 0,
      revenueReceived: 0,
      revenuePending: 0
    };

    quotes.forEach((quote) => {
      const amount = Number(quote.amount || 0);
      summary.totalQuoted += amount;

      if (quote.status === "accepted") {
        summary.acceptedQuoted += amount;
      }

      if (["draft", "sent"].includes(quote.status)) {
        summary.pendingQuoted += amount;
      }
    });

    payments.forEach((payment) => {
      const amount = Number(payment.amount || 0);

      if (payment.paymentStatus === "paid") {
        summary.revenueReceived += amount;
      } else if (["partial", "pending"].includes(payment.paymentStatus)) {
        summary.revenuePending += amount;
      }
    });

    res.json({
      ok: true,
      data: {
        summary: {
          ...summary,
          totalQuotedLabel: formatMoney(summary.totalQuoted),
          acceptedQuotedLabel: formatMoney(summary.acceptedQuoted),
          pendingQuotedLabel: formatMoney(summary.pendingQuoted),
          revenueReceivedLabel: formatMoney(summary.revenueReceived),
          revenuePendingLabel: formatMoney(summary.revenuePending)
        },
        quotes,
        invoices,
        payments,
        clients,
        projects
      }
    });
  } catch (error) {
    next(error);
  }
}

async function createQuote(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};

    if (!canManageFinance(sessionUser.roleName)) {
      return res.status(403).json({
        ok: false,
        message: "Vous n'avez pas les permissions pour creer un devis."
      });
    }

    const { clientId, leadId, projectType, amount, status, notes } = req.body;

    if (!projectType || !amount) {
      return res.status(400).json({
        ok: false,
        message: "Type de projet et montant sont obligatoires"
      });
    }

    const result = await db.query(
      `INSERT INTO quotes (client_id, lead_id, project_type, amount, status, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        clientId || null,
        leadId || null,
        projectType,
        Number(amount),
        status || "draft",
        notes || null
      ]
    );

    await createNotifications(
      await getActiveUserIdsByRoles(["admin", "operations_manager", "project_manager", "sales_manager"]),
      {
        title: "Nouveau devis cree",
        message: `Un devis "${projectType}" de ${formatMoney(amount)} vient d'etre enregistre.`,
        category: "finance",
        linkUrl: "/finance"
      }
    );

    res.status(201).json({
      ok: true,
      message: "Devis cree",
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
}

async function createPayment(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};

    if (!canManageFinance(sessionUser.roleName)) {
      return res.status(403).json({
        ok: false,
        message: "Vous n'avez pas les permissions pour enregistrer un paiement."
      });
    }

    const {
      clientId,
      projectId,
      quoteId,
      invoiceId,
      title,
      amount,
      currency,
      paymentMethod,
      paymentStatus,
      paymentDate,
      notes
    } = req.body;

    if (!title || !amount) {
      return res.status(400).json({
        ok: false,
        message: "Libelle et montant sont obligatoires"
      });
    }

    const result = await db.query(
      `INSERT INTO payment_records
        (client_id, project_id, quote_id, invoice_id, title, amount, currency, payment_method, payment_status, payment_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientId || null,
        projectId || null,
        quoteId || null,
        invoiceId || null,
        title,
        Number(amount),
        (currency || "USD").trim() || "USD",
        paymentMethod || null,
        paymentStatus || "paid",
        paymentDate || null,
        notes || null
      ]
    );

    if (invoiceId) {
      const invoices = await db.query(`SELECT id, amount FROM invoices WHERE id = ? LIMIT 1`, [invoiceId]);
      const invoice = invoices[0];

      if (invoice) {
        let nextStatus = "sent";

        if ((paymentStatus || "paid") === "paid" && Number(amount) >= Number(invoice.amount || 0)) {
          nextStatus = "paid";
        } else if ((paymentStatus || "paid") === "pending") {
          nextStatus = "sent";
        }

        await db.query(`UPDATE invoices SET status = ? WHERE id = ?`, [nextStatus, invoiceId]);
      }
    }

    await createNotifications(
      await getActiveUserIdsByRoles(["admin", "operations_manager", "project_manager", "sales_manager"]),
      {
        title: "Paiement enregistre",
        message: `Le paiement "${title}" de ${formatMoney(amount, currency || "USD")} a ete enregistre.`,
        category: "finance",
        linkUrl: "/finance"
      }
    );

    res.status(201).json({
      ok: true,
      message: "Paiement enregistre",
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
}

async function createInvoiceFromQuote(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};

    if (!canManageFinance(sessionUser.roleName)) {
      return res.status(403).json({
        ok: false,
        message: "Vous n'avez pas les permissions pour creer une facture."
      });
    }

    const { id } = req.params;
    const { dueDate, notes } = req.body;

    const quotes = await db.query(
      `SELECT
        q.id,
        q.client_id AS clientId,
        q.project_type AS projectType,
        q.amount,
        q.status,
        q.notes,
        c.name AS clientName,
        p.id AS projectId
      FROM quotes q
      LEFT JOIN clients c ON c.id = q.client_id
      LEFT JOIN projects p ON p.client_id = q.client_id
      WHERE q.id = ?
      LIMIT 1`,
      [id]
    );

    const quote = quotes[0];

    if (!quote) {
      return res.status(404).json({
        ok: false,
        message: "Devis introuvable"
      });
    }

    const existing = await db.query(`SELECT id, invoice_number AS invoiceNumber FROM invoices WHERE quote_id = ? LIMIT 1`, [id]);

    if (existing.length) {
      return res.status(409).json({
        ok: false,
        message: `Une facture existe deja pour ce devis (${existing[0].invoiceNumber}).`
      });
    }

    const [countRow] = await db.query(`SELECT COUNT(*) AS total FROM invoices`);
    const nextNumber = Number(countRow.total || 0) + 1;
    const invoiceNumber = `WFY-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`;

    const result = await db.query(
      `INSERT INTO invoices
        (quote_id, client_id, project_id, invoice_number, title, amount, currency, status, issued_date, due_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'USD', ?, CURDATE(), ?, ?)`,
      [
        quote.id,
        quote.clientId || null,
        quote.projectId || null,
        invoiceNumber,
        `Facture - ${quote.projectType}`,
        Number(quote.amount || 0),
        quote.status === "accepted" ? "sent" : "draft",
        dueDate || null,
        notes || quote.notes || null
      ]
    );

    await createNotifications(
      await getActiveUserIdsByRoles(["admin", "operations_manager", "project_manager", "sales_manager"]),
      {
        title: "Facture creee",
        message: `La facture ${invoiceNumber} a ete generee pour ${quote.clientName || "un client"}.`,
        category: "finance",
        linkUrl: "/finance"
      }
    );

    res.status(201).json({
      ok: true,
      message: "Facture creee",
      data: {
        id: result.insertId,
        invoiceNumber
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  canManageFinance,
  getFinanceOverview,
  createQuote,
  createPayment,
  createInvoiceFromQuote
};
