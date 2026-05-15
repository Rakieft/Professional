const db = require("../config/db");
const { hasPermission } = require("../middleware/authMiddleware");
const { createActivityLog } = require("../services/activityService");

function canManageLeads(roleName = "") {
  return ["admin", "operations_manager", "project_manager", "sales_manager"].includes(roleName);
}

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

async function createLead(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};

    if (!hasPermission(sessionUser, "leads", "manage")) {
      return res.status(403).json({
        ok: false,
        message: "Vous n'avez pas les permissions pour creer un lead."
      });
    }

    const {
      companyName,
      contactName,
      email,
      phone,
      needSummary,
      projectType,
      budgetRange,
      status = "new",
      source = "Staff",
      notes = ""
    } = req.body;

    if (!companyName || !needSummary) {
      return res.status(400).json({
        ok: false,
        message: "Company name and need summary are required"
      });
    }

    const result = await db.query(
      `INSERT INTO leads
        (company_name, contact_name, email, phone, need_summary, project_type, budget_range, status, source, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyName,
        contactName || null,
        email || null,
        phone || null,
        needSummary,
        projectType || null,
        budgetRange || null,
        status,
        source,
        notes || null
      ]
    );

    await createActivityLog(`Nouveau lead cree: ${companyName}`);

    res.status(201).json({
      ok: true,
      message: "Lead created",
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    next(error);
  }
}

async function convertLeadToClient(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};

    if (!hasPermission(sessionUser, "leads", "manage")) {
      return res.status(403).json({
        ok: false,
        message: "Vous n'avez pas les permissions pour convertir un lead."
      });
    }

    const { id } = req.params;

    const leads = await db.query(
      `SELECT
        id,
        company_name AS companyName,
        contact_name AS contactName,
        email,
        phone,
        need_summary AS needSummary,
        project_type AS projectType,
        budget_range AS budgetRange,
        status,
        notes
      FROM leads
      WHERE id = ?
      LIMIT 1`,
      [id]
    );

    const lead = leads[0];

    if (!lead) {
      return res.status(404).json({
        ok: false,
        message: "Lead introuvable"
      });
    }

    const existingClients = await db.query(
      `SELECT id, name
       FROM clients
       WHERE name = ? OR (email IS NOT NULL AND email = ?)
       LIMIT 1`,
      [lead.companyName, lead.email || null]
    );

    let clientId = existingClients[0]?.id || null;

    if (!clientId) {
      const result = await db.query(
        `INSERT INTO clients
          (name, company_type, contact_name, email, phone, status, notes)
         VALUES (?, ?, ?, ?, ?, 'active', ?)`,
        [
          lead.companyName,
          lead.projectType || null,
          lead.contactName || null,
          lead.email || null,
          lead.phone || null,
          lead.notes || lead.needSummary || null
        ]
      );

      clientId = result.insertId;
    }

    await db.query(`UPDATE leads SET status = 'won' WHERE id = ?`, [id]);
    await createActivityLog(`Lead converti en client: ${lead.companyName}`);

    res.json({
      ok: true,
      message: existingClients[0]
        ? "Lead marque comme gagne et rattache a un client existant"
        : "Lead converti en client avec succes",
      data: {
        clientId
      }
    });
  } catch (error) {
    next(error);
  }
}

function inferServiceName(projectType = "", needSummary = "") {
  const haystack = `${projectType} ${needSummary}`.toLowerCase();

  if (haystack.includes("social")) {
    return "Social media";
  }

  if (haystack.includes("brand") || haystack.includes("logo")) {
    return "Branding";
  }

  if (haystack.includes("app") || haystack.includes("dashboard") || haystack.includes("crm")) {
    return "Development";
  }

  return "Web design";
}

function inferProjectTemplate(projectType = "", needSummary = "") {
  const haystack = `${projectType} ${needSummary}`.toLowerCase();

  if (haystack.includes("social")) {
    return "social_media";
  }

  if (haystack.includes("brand") || haystack.includes("logo")) {
    return "branding";
  }

  if (haystack.includes("app") || haystack.includes("dashboard") || haystack.includes("crm")) {
    return "application";
  }

  return "website";
}

function getTaskTemplates(templateKey) {
  const templates = {
    website: [
      {
        title: "Cadrage du besoin",
        description: "Clarifier les objectifs, le contenu attendu, la structure et le niveau de finition du site.",
        priority: "high",
        roleName: "project_manager"
      },
      {
        title: "Arborescence et sections",
        description: "Definir les pages, la hierarchie du contenu et les appels a l'action principaux.",
        priority: "high",
        roleName: "project_manager"
      },
      {
        title: "Direction visuelle",
        description: "Poser la direction graphique, les references et la logique visuelle du projet.",
        priority: "medium",
        roleName: "designer"
      },
      {
        title: "Integration et developpement",
        description: "Construire les pages et l'experience utilisateur prevue pour la version publique.",
        priority: "high",
        roleName: "developer"
      },
      {
        title: "Tests et livraison",
        description: "Verifier le responsive, les liens, les formulaires et preparer la mise en ligne.",
        priority: "medium",
        roleName: "operations_manager"
      }
    ],
    branding: [
      {
        title: "Brief de marque",
        description: "Comprendre le positionnement, la cible, le ton et les references visuelles.",
        priority: "high",
        roleName: "project_manager"
      },
      {
        title: "Recherche creative",
        description: "Explorer les pistes graphiques, univers visuels et symboliques utiles.",
        priority: "medium",
        roleName: "designer"
      },
      {
        title: "Propositions logo",
        description: "Produire les pistes de logo et les variantes principales pour presentation.",
        priority: "high",
        roleName: "designer"
      },
      {
        title: "Retours et ajustements",
        description: "Integrer les commentaires, finaliser la piste retenue et preparer les declinaisons.",
        priority: "medium",
        roleName: "designer"
      },
      {
        title: "Livraison des assets",
        description: "Exporter les formats, organiser les livrables et remettre les fichiers finaux.",
        priority: "medium",
        roleName: "operations_manager"
      }
    ],
    social_media: [
      {
        title: "Audit express des comptes",
        description: "Analyser la presence existante, les manques et les opportunites de contenu.",
        priority: "high",
        roleName: "social_media_manager"
      },
      {
        title: "Calendrier editorial",
        description: "Definir le rythme, les themes et les formats prioritaires.",
        priority: "high",
        roleName: "social_media_manager"
      },
      {
        title: "Production des visuels",
        description: "Creer les supports graphiques necessaires pour la premiere vague de posts.",
        priority: "medium",
        roleName: "designer"
      },
      {
        title: "Redaction des captions",
        description: "Produire les textes, accroches et appels a l'action des publications.",
        priority: "medium",
        roleName: "content_creator"
      },
      {
        title: "Programmation et validation",
        description: "Planifier les publications et verifier les elements avant diffusion.",
        priority: "medium",
        roleName: "social_media_manager"
      }
    ],
    application: [
      {
        title: "Cadrage fonctionnel",
        description: "Lister les besoins metier, les roles, les ecrans et les flux du systeme.",
        priority: "high",
        roleName: "project_manager"
      },
      {
        title: "Structure technique",
        description: "Poser la base de donnees, les entites principales et la logique generale.",
        priority: "high",
        roleName: "developer"
      },
      {
        title: "Interface produit",
        description: "Designer le dashboard, les vues clefs et l'experience utilisateur interne.",
        priority: "medium",
        roleName: "designer"
      },
      {
        title: "Developpement du module coeur",
        description: "Implementer le module prioritaire et le flux principal de travail.",
        priority: "high",
        roleName: "developer"
      },
      {
        title: "Recette et mise en service",
        description: "Tester les parcours, corriger les points bloquants et preparer la mise en ligne.",
        priority: "medium",
        roleName: "operations_manager"
      }
    ]
  };

  return templates[templateKey] || templates.website;
}

function getPreferredOwnerRoles(templateKey) {
  const ownerRoles = {
    website: ["project_manager", "operations_manager", "admin"],
    branding: ["project_manager", "designer", "admin"],
    social_media: ["social_media_manager", "project_manager", "admin"],
    application: ["project_manager", "developer", "operations_manager", "admin"]
  };

  return ownerRoles[templateKey] || ["project_manager", "operations_manager", "admin"];
}

async function getActiveUsersByRole() {
  const users = await db.query(
    `SELECT u.id, COALESCE(r.name, 'staff') AS roleName
     FROM users u
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE u.is_active = 1
     ORDER BY u.created_at ASC`
  );

  return users.reduce((accumulator, user) => {
    if (!accumulator[user.roleName]) {
      accumulator[user.roleName] = [];
    }

    accumulator[user.roleName].push(user.id);
    return accumulator;
  }, {});
}

function getFirstMatchingUserId(usersByRole, roleNames = []) {
  for (const roleName of roleNames) {
    const userId = usersByRole[roleName]?.[0];

    if (userId) {
      return userId;
    }
  }

  return null;
}

async function convertLeadToProject(req, res, next) {
  try {
    const sessionUser = req.session?.user || {};

    if (!hasPermission(sessionUser, "leads", "manage")) {
      return res.status(403).json({
        ok: false,
        message: "Vous n'avez pas les permissions pour convertir un lead en projet."
      });
    }

    const { id } = req.params;

    const leads = await db.query(
      `SELECT
        id,
        company_name AS companyName,
        contact_name AS contactName,
        email,
        phone,
        need_summary AS needSummary,
        project_type AS projectType,
        budget_range AS budgetRange,
        status,
        notes
      FROM leads
      WHERE id = ?
      LIMIT 1`,
      [id]
    );

    const lead = leads[0];

    if (!lead) {
      return res.status(404).json({
        ok: false,
        message: "Lead introuvable"
      });
    }

    const existingClients = await db.query(
      `SELECT id, name
       FROM clients
       WHERE name = ? OR (email IS NOT NULL AND email = ?)
       LIMIT 1`,
      [lead.companyName, lead.email || null]
    );

    let clientId = existingClients[0]?.id || null;

    if (!clientId) {
      const clientResult = await db.query(
        `INSERT INTO clients
          (name, company_type, contact_name, email, phone, status, notes)
         VALUES (?, ?, ?, ?, ?, 'active', ?)`,
        [
          lead.companyName,
          lead.projectType || null,
          lead.contactName || null,
          lead.email || null,
          lead.phone || null,
          lead.notes || lead.needSummary || null
        ]
      );

      clientId = clientResult.insertId;
    }

    const serviceName = inferServiceName(lead.projectType, lead.needSummary);
    const templateKey = inferProjectTemplate(lead.projectType, lead.needSummary);
    const usersByRole = await getActiveUsersByRole();
    const ownerUserId = getFirstMatchingUserId(usersByRole, getPreferredOwnerRoles(templateKey));
    const services = await db.query(`SELECT id FROM services WHERE name = ? LIMIT 1`, [serviceName]);
    const serviceId = services[0]?.id || null;
    const projectName = `${lead.companyName} - ${lead.projectType || lead.needSummary}`;

    const existingProjects = await db.query(
      `SELECT id, name
       FROM projects
       WHERE client_id = ? AND name = ?
       LIMIT 1`,
      [clientId, projectName]
    );

    let projectId = existingProjects[0]?.id || null;

    if (!projectId) {
      const projectResult = await db.query(
        `INSERT INTO projects
          (client_id, primary_service_id, owner_user_id, name, description, status, priority, budget, start_date)
         VALUES (?, ?, ?, ?, ?, 'planned', 'medium', NULL, CURDATE())`,
        [
          clientId,
          serviceId,
          ownerUserId,
          projectName,
          `${lead.needSummary}${lead.budgetRange ? ` | Budget indicatif: ${lead.budgetRange}` : ""}${lead.notes ? ` | Notes: ${lead.notes}` : ""}`
        ]
      );

      projectId = projectResult.insertId;

      const taskTemplates = getTaskTemplates(templateKey);

      for (const task of taskTemplates) {
        const assigneeUserId = getFirstMatchingUserId(usersByRole, [task.roleName, "operations_manager", "admin"]);
        await db.query(
          `INSERT INTO tasks
            (project_id, assignee_user_id, title, description, status, priority, due_date)
           VALUES (?, ?, ?, ?, 'todo', ?, NULL)`,
          [projectId, assigneeUserId, task.title, `${task.description} | Role cible: ${task.roleName}`, task.priority]
        );
      }

      await db.query(
        `INSERT INTO activity_logs (project_id, message, happened_at)
         VALUES (?, ?, NOW())`,
        [projectId, "Projet cree automatiquement depuis un lead avec generation des taches initiales."]
      );
    }

    await db.query(`UPDATE leads SET status = 'won' WHERE id = ?`, [id]);
    await createActivityLog(`Lead converti en projet: ${lead.companyName}`, projectId);

    res.json({
      ok: true,
      message: existingProjects[0]
        ? "Lead converti et rattache a un projet existant"
        : "Lead converti en client et projet avec succes",
      data: {
        clientId,
        projectId
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listLeads,
  createLead,
  convertLeadToClient,
  convertLeadToProject
};
