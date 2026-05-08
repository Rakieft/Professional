const db = require("../config/db");

const fallbackData = {
  metrics: {
    activeProjects: 4,
    openTasks: 12,
    scheduledContent: 9,
    openLeads: 3
  },
  projects: [
    {
      name: "Refonte WebFy",
      service: "Web design",
      owner: "Design team",
      status: "in_progress"
    },
    {
      name: "Campagne lancement",
      service: "Social media",
      owner: "Content lead",
      status: "review"
    },
    {
      name: "Pack logo client",
      service: "Branding",
      owner: "Creative team",
      status: "done"
    }
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

async function getDashboardOverview(_req, res, next) {
  try {
    const [projectCounts] = await Promise.all([
      db.query(
        `SELECT
          SUM(CASE WHEN status IN ('planned', 'in_progress', 'review') THEN 1 ELSE 0 END) AS activeProjects,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedProjects
        FROM projects`
      )
    ]);

    const [taskCounts, projects, content, leads, activities] = await Promise.all([
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
      )
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
        source: "database"
      }
    });
  } catch (error) {
    if (error && error.code) {
      return res.json({
        ok: true,
        warning: `Database unavailable: ${error.code}`,
        data: fallbackData
      });
    }

    return next(error);
  }
}

module.exports = {
  getDashboardOverview
};
