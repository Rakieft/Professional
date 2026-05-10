const db = require("../config/db");

const fallbackData = {
  metrics: {
    activeProjects: 4,
    openTasks: 12,
    scheduledContent: 9,
    openLeads: 3
  },
  projects: [
    { name: "Refonte WebFy", service: "Web design", owner: "Design team", status: "in_progress" },
    { name: "Campagne lancement", service: "Social media", owner: "Content lead", status: "review" },
    { name: "Pack logo client", service: "Branding", owner: "Creative team", status: "done" }
  ],
  content: [
    { dayLabel: "Lundi", title: "Reel branding - Instagram" },
    { dayLabel: "Mardi", title: "Post portfolio - Facebook" },
    { dayLabel: "Jeudi", title: "Carrousel services - LinkedIn" }
  ],
  leads: [
    { companyName: "Startup e-commerce", needSummary: "Site + branding" },
    { companyName: "Restaurant local", needSummary: "Contenu social" },
    { companyName: "Clinique privee", needSummary: "Refonte digitale" }
  ],
  activities: [
    { happenedAt: "09:15", message: "Validation du hero redesign pour la vitrine WebFy." },
    { happenedAt: "10:30", message: "Trois posts ont ete ajoutes au calendrier social media." },
    { happenedAt: "13:00", message: "Le pole design prepare une proposition de logo client." }
  ],
  source: "fallback"
};

function buildRoleConfig(roleName = "staff") {
  const configs = {
    admin: {
      summary: "Vue executive sur les ventes, les projets, l'equipe et la production.",
      focusLabel: "Direction",
      focusTitle: "Ce que la direction doit voir en premier",
      focusBadge: "Admin",
      quickActionsTitle: "Decisions prioritaires",
      activityTitle: "Signaux a surveiller aujourd'hui",
      myWorkTitle: "Actions de pilotage immediates",
      focusItems: [
        { title: "Vision globale", text: "Suivre en meme temps les leads, les comptes actifs, les projets et la charge staff." },
        { title: "Croissance", text: "Identifier ce qui bloque les ventes, la livraison ou la qualite d'execution." },
        { title: "Structure", text: "Verifier que les roles, les responsables et les echeances sont bien distribues." }
      ],
      quickActions: [
        { title: "Equipe", status: "priorite", text: "Structurer les comptes et les roles pour chaque membre du staff." },
        { title: "Projets", status: "actif", text: "Voir les projets qui consomment le plus d'energie ou de budget." },
        { title: "Leads", status: "suivi", text: "Traiter les opportunites commerciales encore ouvertes." }
      ]
    },
    operations_manager: {
      summary: "Vue operations sur la charge, les blocages, les echeances et la coordination equipe.",
      focusLabel: "Operations",
      focusTitle: "Ce que l'operations manager doit garder sous controle",
      focusBadge: "Operations",
      quickActionsTitle: "Coordination rapide",
      activityTitle: "Points de coordination du jour",
      myWorkTitle: "File operations",
      focusItems: [
        { title: "Charge equipe", text: "Equilibrer les capacites entre design, dev, contenu et support." },
        { title: "Rythme", text: "Maintenir l'avance sur les taches en retard et les validations." },
        { title: "Execution", text: "Faire circuler les projets entre production, review et livraison." }
      ],
      quickActions: [
        { title: "Taches", status: "central", text: "Revoir les actions ouvertes et redistribuer si besoin." },
        { title: "Projets", status: "actif", text: "Verifier statuts, budgets et echeances des missions." },
        { title: "Equipe", status: "pilotage", text: "Ajuster les roles et responsables selon la charge." }
      ]
    },
    project_manager: {
      summary: "Vue projet sur les clients, les briefs, les validations et les livrables.",
      focusLabel: "Gestion projet",
      focusTitle: "Ce que le project manager doit voir en premier",
      focusBadge: "Project",
      quickActionsTitle: "Suivi client rapide",
      activityTitle: "Mouvements projet du jour",
      myWorkTitle: "File projet",
      focusItems: [
        { title: "Clients actifs", text: "Suivre les demandes en cours, les attentes et les deadlines." },
        { title: "Validations", text: "Faire avancer les briefs, retours et livraisons vers la prochaine etape." },
        { title: "Coordination", text: "Connecter design, dev et contenu autour de la meme priorite." }
      ],
      quickActions: [
        { title: "Clients", status: "actif", text: "Centraliser les contacts et les statuts relationnels." },
        { title: "Projets", status: "priorite", text: "Suivre les missions en cours et leurs proprietaires." },
        { title: "Leads", status: "commercial", text: "Basculer les prospects qualifies vers de vrais comptes." }
      ]
    },
    designer: {
      summary: "Vue design sur les livrables visuels, logos, identites et validations client.",
      focusLabel: "Design",
      focusTitle: "Ce que le pole design doit produire maintenant",
      focusBadge: "Design",
      quickActionsTitle: "Production visuelle",
      activityTitle: "Flux design du jour",
      myWorkTitle: "Ma file design",
      focusItems: [
        { title: "Livrables visuels", text: "Prioriser les logos, maquettes, assets et retours clients." },
        { title: "Validation", text: "Isoler ce qui attend une approbation avant livraison." },
        { title: "Cohérence", text: "Maintenir un niveau premium sur chaque support graphique." }
      ],
      quickActions: [
        { title: "Taches", status: "central", text: "Voir les demandes creees pour design et branding." },
        { title: "Projets", status: "actif", text: "Identifier le contexte client et le niveau d'urgence." },
        { title: "Equipe", status: "support", text: "Savoir qui coordonne ou valide les productions." }
      ]
    },
    developer: {
      summary: "Vue technique sur les taches, corrections, livraisons et echeances de production.",
      focusLabel: "Developpement",
      focusTitle: "Ce que le pole technique doit executer maintenant",
      focusBadge: "Dev",
      quickActionsTitle: "Execution technique",
      activityTitle: "Mouvements techniques du jour",
      myWorkTitle: "Ma file technique",
      focusItems: [
        { title: "Taches assignees", text: "Se concentrer sur les actions liees aux projets actifs." },
        { title: "Livraison", text: "Prioriser les correctifs, la review et les echeances proches." },
        { title: "Structure", text: "Garder une execution propre entre front, back et dashboard." }
      ],
      quickActions: [
        { title: "Taches", status: "priorite", text: "Filtrer les items ouverts et les urgences techniques." },
        { title: "Projets", status: "actif", text: "Comprendre le projet auquel chaque tache appartient." },
        { title: "Clients", status: "contexte", text: "Acceder au contexte si un besoin change ou s'etend." }
      ]
    },
    content_creator: {
      summary: "Vue contenu sur la production editoriale, scripts, textes et assets a livrer.",
      focusLabel: "Contenu",
      focusTitle: "Ce que le pole contenu doit sortir maintenant",
      focusBadge: "Content",
      quickActionsTitle: "Production editoriale",
      activityTitle: "Flux contenu du jour",
      myWorkTitle: "Ma file contenu",
      focusItems: [
        { title: "Calendrier", text: "Voir ce qui doit etre ecrit, tourne, prepare ou programme." },
        { title: "Production", text: "Prioriser les contenus utiles pour les campagnes et la vitrine." },
        { title: "Validation", text: "Coordonner les retours entre strategie, design et social media." }
      ],
      quickActions: [
        { title: "Contenu", status: "actif", text: "Revoir le planning editorial et la cadence." },
        { title: "Taches", status: "central", text: "Executer les demandes liees aux posts et livrables." },
        { title: "Projets", status: "support", text: "Verifier quel client ou campagne pilote la demande." }
      ]
    },
    social_media_manager: {
      summary: "Vue social media sur le calendrier, les publications et les campagnes actives.",
      focusLabel: "Social media",
      focusTitle: "Ce que le social media manager doit piloter aujourd'hui",
      focusBadge: "Social",
      quickActionsTitle: "Actions de campagne",
      activityTitle: "Mouvements social media du jour",
      myWorkTitle: "Ma file social media",
      focusItems: [
        { title: "Cadence", text: "Maintenir les publications, stories et campagnes dans le bon tempo." },
        { title: "Visibilite", text: "Relier contenu, visuel et calendrier a des objectifs concrets." },
        { title: "Coordination", text: "Faire remonter ce qui bloque la programmation ou la diffusion." }
      ],
      quickActions: [
        { title: "Contenu", status: "priorite", text: "Verifier ce qui est publie, planifie ou en attente." },
        { title: "Taches", status: "central", text: "Prendre les actions liees aux campagnes et revisions." },
        { title: "Leads", status: "signal", text: "Observer les nouveaux besoins venant du marketing." }
      ]
    },
    sales_manager: {
      summary: "Vue commerciale sur les leads, les relances, les devis et les opportunites a convertir.",
      focusLabel: "Sales",
      focusTitle: "Ce que le sales manager doit faire avancer",
      focusBadge: "Sales",
      quickActionsTitle: "Pipeline commercial",
      activityTitle: "Mouvements commerciaux du jour",
      myWorkTitle: "Ma file commerciale",
      focusItems: [
        { title: "Leads ouverts", text: "Identifier les prospects a contacter ou a relancer en premier." },
        { title: "Qualification", text: "Isoler les besoins les plus prometteurs pour les transformer en clients." },
        { title: "Transmission", text: "Passer les bons dossiers vers projets et production au bon moment." }
      ],
      quickActions: [
        { title: "Leads", status: "priorite", text: "Voir les opportunites commerciales encore ouvertes." },
        { title: "Clients", status: "conversion", text: "Basculer les leads qualifies en comptes actifs." },
        { title: "Projets", status: "handoff", text: "Verifier que la promesse vendue sera bien livree." }
      ]
    },
    support_manager: {
      summary: "Vue support sur les demandes client, corrections et suivi apres livraison.",
      focusLabel: "Support",
      focusTitle: "Ce que le support doit resoudre rapidement",
      focusBadge: "Support",
      quickActionsTitle: "Suivi client",
      activityTitle: "Demandes support du jour",
      myWorkTitle: "Ma file support",
      focusItems: [
        { title: "Demandes en attente", text: "Repérer les clients qui attendent une reponse ou une correction." },
        { title: "Suivi", text: "Maintenir un niveau de service rassurant apres livraison." },
        { title: "Remontee", text: "Envoyer a design ou dev ce qui doit etre corrige rapidement." }
      ],
      quickActions: [
        { title: "Clients", status: "actif", text: "Voir les comptes qui demandent un suivi immediat." },
        { title: "Taches", status: "escalade", text: "Creer les actions correctives et les assigner." },
        { title: "Projets", status: "contexte", text: "Comprendre ce qui a ete livre avant d'intervenir." }
      ]
    }
  };

  return configs[roleName] || {
    summary: "Vue staff sur les projets, les actions et la coordination de l'equipe.",
    focusLabel: "Pilotage",
    focusTitle: "Ce que l'equipe doit voir en premier",
    focusBadge: "Vision staff",
    quickActionsTitle: "Zones prioritaires",
    activityTitle: "Ce qui bouge aujourd'hui",
    myWorkTitle: "Travail prioritaire pour cette session",
    focusItems: [
      { title: "Priorites du jour", text: "Clients actifs, projets ouverts, contenu a produire et leads a traiter depuis une seule surface." },
      { title: "Coordination", text: "Les modules deviennent des postes de travail concrets pour Operations, Design, Dev, Sales et Support." },
      { title: "Productivite", text: "Le dashboard relie les roles a de vraies actions quotidiennes." }
    ],
    quickActions: [
      { title: "Clients", status: "actif", text: "Centraliser les comptes, contacts et statuts commerciaux." },
      { title: "Projets", status: "actif", text: "Structurer les missions avec responsable, service, budget et echeance." },
      { title: "Taches", status: "central", text: "Transformer le dashboard en outil de travail quotidien." }
    ]
  };
}

function mapProjectStatus(status) {
  switch (status) {
    case "done":
      return "done";
    case "review":
      return "review";
    default:
      return "in_progress";
  }
}

async function getDashboardOverview(req, res, next) {
  const sessionUser = req.session?.user || {};
  const roleConfig = buildRoleConfig(sessionUser.roleName || "staff");
  const currentUserId = sessionUser.id || null;

  try {
    const [projectCounts] = await Promise.all([
      db.query(
        `SELECT
          SUM(CASE WHEN status IN ('planned', 'in_progress', 'review') THEN 1 ELSE 0 END) AS activeProjects,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedProjects
        FROM projects`
      )
    ]);

    const [taskCounts, projects, content, leads, activities, myTasks] = await Promise.all([
      db.query(
        `SELECT COUNT(*) AS openTasks
         FROM tasks
         WHERE status IN ('todo', 'in_progress', 'review')`
      ),
      db.query(
        `SELECT p.name, s.name AS service, COALESCE(u.full_name, 'Unassigned') AS owner, p.status
         FROM projects p
         LEFT JOIN services s ON s.id = p.primary_service_id
         LEFT JOIN users u ON u.id = p.owner_user_id
         ORDER BY p.updated_at DESC
         LIMIT 6`
      ),
      db.query(
        `SELECT day_label AS dayLabel, title
         FROM content_calendar
         ORDER BY publish_date ASC
         LIMIT 6`
      ),
      db.query(
        `SELECT company_name AS companyName, need_summary AS needSummary
         FROM leads
         WHERE status IN ('new', 'contacted', 'qualified')
         ORDER BY created_at DESC
         LIMIT 6`
      ),
      db.query(
        `SELECT TIME_FORMAT(happened_at, '%H:%i') AS happenedAt, message
         FROM activity_logs
         ORDER BY happened_at DESC
         LIMIT 6`
      ),
      currentUserId
        ? db.query(
            `SELECT
              t.title,
              t.status,
              t.priority,
              DATE_FORMAT(t.due_date, '%Y-%m-%d') AS dueDate,
              COALESCE(p.name, 'Sans projet') AS projectName
             FROM tasks t
             LEFT JOIN projects p ON p.id = t.project_id
             WHERE t.assignee_user_id = ?
             ORDER BY
               CASE t.status
                 WHEN 'todo' THEN 1
                 WHEN 'in_progress' THEN 2
                 WHEN 'review' THEN 3
                 ELSE 4
               END,
               t.due_date IS NULL,
               t.due_date ASC,
               t.updated_at DESC
             LIMIT 6`,
            [currentUserId]
          )
        : Promise.resolve([])
    ]);

    res.json({
      ok: true,
      data: {
        metrics: {
          activeProjects: Number(projectCounts?.activeProjects || 0),
          openTasks: Number(taskCounts?.[0]?.openTasks || 0),
          scheduledContent: content.length,
          openLeads: leads.length
        },
        projects: projects.map((project) => ({
          ...project,
          status: mapProjectStatus(project.status)
        })),
        content,
        leads,
        activities,
        roleView: roleConfig,
        myTasks: myTasks.length
          ? myTasks
          : [
              {
                title: "Structurer les priorites du jour",
                status: "todo",
                priority: "high",
                dueDate: null,
                projectName: "Dashboard staff"
              }
            ],
        source: "database"
      }
    });
  } catch (error) {
    if (error && error.code) {
      return res.json({
        ok: true,
        warning: `Database unavailable: ${error.code}`,
        data: {
          ...fallbackData,
          roleView: roleConfig,
          myTasks: [
            {
              title: "Verifier la connexion de la base et la file du role",
              status: "todo",
              priority: "high",
              dueDate: null,
              projectName: "Systeme staff"
            }
          ]
        }
      });
    }

    return next(error);
  }
}

module.exports = {
  getDashboardOverview
};
