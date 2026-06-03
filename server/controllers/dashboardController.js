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
    { dayLabel: "Jeudi", title: "Carrousel services - TikTok" }
  ],
  leads: [
    { companyName: "Startup e-commerce", needSummary: "Site + branding" },
    { companyName: "Restaurant local", needSummary: "Contenu social" },
    { companyName: "Clinique privee", needSummary: "Refonte digitale" }
  ],
  activities: [
    { happenedAt: "09:15", message: "Validation du hero redesign pour la vitrine WebFy." },
    { happenedAt: "10:30", message: "Trois contenus ont ete ajoutes au calendrier marketing." },
    { happenedAt: "13:00", message: "Le pole design prepare un nouveau support visuel client." }
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
        { title: "Structure", text: "Verifier que les nouveaux postes sont bien repartis entre marketing, dev, admin et sales." }
      ],
      quickActions: [
        { title: "Equipe", status: "priorite", text: "Verifier que les 8 postes actifs gardent une charge claire." },
        { title: "Projets", status: "actif", text: "Voir les projets qui consomment le plus d'energie ou de budget." },
        { title: "Leads", status: "suivi", text: "Traiter les opportunites commerciales encore ouvertes." }
      ]
    },
    marketing_lead: {
      summary: "Vue marketing sur les campagnes, les priorites de contenu et la coordination de l'equipe marketing.",
      focusLabel: "Marketing",
      focusTitle: "Ce que le marketing lead doit piloter maintenant",
      focusBadge: "Marketing lead",
      quickActionsTitle: "Priorites de coordination",
      activityTitle: "Signal marketing du jour",
      myWorkTitle: "Ma file marketing",
      focusItems: [
        { title: "Calendrier", text: "Verifier la cadence editoriale, les campagnes et les priorites de diffusion." },
        { title: "Coordination", text: "Relier contenu, design, community et sales autour des memes objectifs." },
        { title: "Execution", text: "S'assurer que les demandes urgentes passent vite vers dev ou production." }
      ],
      quickActions: [
        { title: "Leads", status: "priorite", text: "Suivre les demandes entrantes et aider leur conversion." },
        { title: "Projets", status: "pilotage", text: "Verifier les missions client qui demandent du contenu ou du suivi." },
        { title: "Taches", status: "central", text: "Repartir clairement le travail entre les 4 profils marketing." }
      ]
    },
    content_creator: {
      summary: "Vue contenu sur la production editoriale, scripts, textes et captions a livrer.",
      focusLabel: "Contenu",
      focusTitle: "Ce que le content creator doit sortir maintenant",
      focusBadge: "Content",
      quickActionsTitle: "Production editoriale",
      activityTitle: "Flux contenu du jour",
      myWorkTitle: "Ma file contenu",
      focusItems: [
        { title: "Calendrier", text: "Voir ce qui doit etre ecrit, tourne, prepare ou programme." },
        { title: "Production", text: "Prioriser les contenus utiles pour les campagnes et la vitrine." },
        { title: "Validation", text: "Coordonner les retours entre strategie, design et community." }
      ],
      quickActions: [
        { title: "Contenu", status: "actif", text: "Revoir le planning editorial et la cadence." },
        { title: "Taches", status: "central", text: "Executer les demandes liees aux posts et livrables." },
        { title: "Projets", status: "support", text: "Verifier quel client ou campagne pilote la demande." }
      ]
    },
    visual_designer: {
      summary: "Vue design sur les visuels, carrousels, assets et coherence de marque.",
      focusLabel: "Design visuel",
      focusTitle: "Ce que le designer visuel doit produire maintenant",
      focusBadge: "Designer",
      quickActionsTitle: "Production visuelle",
      activityTitle: "Flux design du jour",
      myWorkTitle: "Ma file design",
      focusItems: [
        { title: "Visuels a livrer", text: "Prioriser les supports graphiques attendus par marketing et ventes." },
        { title: "Image de marque", text: "Maintenir un rendu propre et coherent sur tous les canaux." },
        { title: "Support equipe", text: "Fournir vite les assets utiles au contenu, au social et au site." }
      ],
      quickActions: [
        { title: "Taches", status: "priorite", text: "Ouvrir les demandes de visuels et les delais clients." },
        { title: "Fichiers", status: "support", text: "Ranger les assets, references et exports utiles a l'equipe." },
        { title: "Projets", status: "actif", text: "Revoir les missions qui demandent une presentation premium." }
      ]
    },
    community_manager: {
      summary: "Vue community sur les publications, l'animation des comptes et les retours du public.",
      focusLabel: "Community",
      focusTitle: "Ce que le community manager doit faire avancer",
      focusBadge: "Community",
      quickActionsTitle: "Animation & diffusion",
      activityTitle: "Mouvements social media du jour",
      myWorkTitle: "Ma file community",
      focusItems: [
        { title: "Publication", text: "Garder les contenus publies, programmes et suivis sans rupture." },
        { title: "Interaction", text: "Suivre les messages, commentaires et signaux utiles a remonter." },
        { title: "Campagnes", text: "Verifier que les actions marketing gardent un bon rythme de diffusion." }
      ],
      quickActions: [
        { title: "Contenu", status: "actif", text: "Savoir quoi publier, quand et sur quel canal." },
        { title: "Taches", status: "priorite", text: "Traiter les actions liees aux posts, revisions et validations." },
        { title: "Leads", status: "signal", text: "Faire remonter les besoins ou questions observes en ligne." }
      ]
    },
    frontend_developer: {
      summary: "Vue frontend sur les interfaces, integrations UI et finitions visibles du produit.",
      focusLabel: "Frontend",
      focusTitle: "Ce que le developpeur frontend doit executer",
      focusBadge: "Front-end",
      quickActionsTitle: "Execution interface",
      activityTitle: "Mouvements produit du jour",
      myWorkTitle: "Ma file frontend",
      focusItems: [
        { title: "Interfaces", text: "Faire avancer les vues publiques, le dashboard et les parcours utilisateur." },
        { title: "Responsive", text: "Prioriser les points de finition qui impactent la lecture et la navigation." },
        { title: "Livraison", text: "Rester aligne avec backend, design et besoins marketing." }
      ],
      quickActions: [
        { title: "Taches", status: "priorite", text: "Filtrer les demandes d'integration, de correction et d'UX." },
        { title: "Projets", status: "actif", text: "Comprendre le contexte client ou produit de chaque tache." },
        { title: "Fichiers", status: "support", text: "Recuperer maquettes, references et assets avant integration." }
      ]
    },
    backend_developer: {
      summary: "Vue backend sur l'API, la base de donnees et la logique metier du systeme.",
      focusLabel: "Backend",
      focusTitle: "Ce que le developpeur backend doit verrouiller",
      focusBadge: "Back-end",
      quickActionsTitle: "Execution technique",
      activityTitle: "Flux systeme du jour",
      myWorkTitle: "Ma file backend",
      focusItems: [
        { title: "Structure", text: "Maintenir les routes, la base et les permissions dans un etat stable." },
        { title: "Fiabilite", text: "Prioriser les correctifs qui bloquent l'equipe ou les formulaires publics." },
        { title: "Evolution", text: "Faire avancer les modules internes sans casser le reste du produit." }
      ],
      quickActions: [
        { title: "Taches", status: "priorite", text: "Ouvrir les urgences liees a la logique, aux donnees ou aux flux." },
        { title: "Projets", status: "actif", text: "Voir quelles missions demandent du backend ou des integrations." },
        { title: "Fichiers", status: "support", text: "Centraliser references et documents utiles au build." }
      ]
    },
    administrative_assistant: {
      summary: "Vue administrative sur l'organisation interne, le suivi des dossiers et la coordination utile.",
      focusLabel: "Administration",
      focusTitle: "Ce que l'assistante administrative doit garder clair",
      focusBadge: "Admin support",
      quickActionsTitle: "Organisation quotidienne",
      activityTitle: "Flux administratif du jour",
      myWorkTitle: "Ma file administrative",
      focusItems: [
        { title: "Suivi interne", text: "Maintenir les informations, relances et dossiers bien organises." },
        { title: "Appui equipe", text: "Aider marketing, sales et direction sur les points administratifs utiles." },
        { title: "Clarte", text: "Faire circuler les bonnes informations au bon moment." }
      ],
      quickActions: [
        { title: "Equipe", status: "pilotage", text: "Aider a tenir les comptes staff, roles et informations a jour." },
        { title: "Clients", status: "suivi", text: "Centraliser les contacts et les besoins administratifs." },
        { title: "Finance", status: "support", text: "Suivre devis, paiements ou pieces utiles a l'entreprise." }
      ]
    },
    business_sales: {
      summary: "Vue commerciale sur les leads, les relances, les devis et les opportunites a convertir.",
      focusLabel: "Business",
      focusTitle: "Ce que le business sales doit faire avancer",
      focusBadge: "Sales",
      quickActionsTitle: "Pipeline commercial",
      activityTitle: "Mouvements commerciaux du jour",
      myWorkTitle: "Ma file commerciale",
      focusItems: [
        { title: "Leads ouverts", text: "Identifier les prospects a contacter ou a relancer en premier." },
        { title: "Qualification", text: "Isoler les besoins les plus prometteurs pour les transformer en clients." },
        { title: "Transmission", text: "Passer les bons dossiers vers production au bon moment." }
      ],
      quickActions: [
        { title: "Leads", status: "priorite", text: "Voir les opportunites commerciales encore ouvertes." },
        { title: "Clients", status: "conversion", text: "Basculer les leads qualifies en comptes actifs." },
        { title: "Finance", status: "handoff", text: "Verifier devis, paiements et attentes avant lancement." }
      ]
    }
  };

  configs.operations_manager = configs.marketing_lead;
  configs.project_manager = configs.marketing_lead;
  configs.designer = configs.visual_designer;
  configs.developer = configs.backend_developer;
  configs.social_media_manager = configs.community_manager;
  configs.sales_manager = configs.business_sales;
  configs.support_manager = configs.administrative_assistant;

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
      { title: "Coordination", text: "Le staff tourne maintenant autour du marketing, du dev, de l'administratif et du sales." },
      { title: "Productivite", text: "Le dashboard relie les postes reels a de vraies actions quotidiennes." }
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
