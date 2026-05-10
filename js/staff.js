const metricProjects = document.getElementById("metric-projects");
const metricProjectsCopy = document.getElementById("metric-projects-copy");
const metricTasks = document.getElementById("metric-tasks");
const metricContent = document.getElementById("metric-content");
const metricLeads = document.getElementById("metric-leads");
const dashboardSource = document.getElementById("dashboard-source");
const projectTable = document.getElementById("project-table");
const scheduleList = document.getElementById("schedule-list");
const leadList = document.getElementById("lead-list");
const activityFeed = document.getElementById("activity-feed");
const staffRoleSummary = document.getElementById("staff-role-summary");
const focusLabel = document.getElementById("focus-label");
const focusTitle = document.getElementById("focus-title");
const focusBadge = document.getElementById("focus-badge");
const roleFocusList = document.getElementById("role-focus-list");
const quickActionsTitle = document.getElementById("quick-actions-title");
const quickActionsList = document.getElementById("quick-actions-list");
const activityTitle = document.getElementById("activity-title");
const myWorkTitle = document.getElementById("my-work-title");
const myWorkList = document.getElementById("my-work-list");

function statusLabel(status) {
  switch (status) {
    case "in_progress":
      return "En cours";
    case "review":
      return "Validation";
    case "done":
      return "Termine";
    default:
      return "A faire";
  }
}

function priorityLabel(priority) {
  switch (priority) {
    case "high":
      return "Haute";
    case "low":
      return "Basse";
    default:
      return "Moyenne";
  }
}

function renderProjects(projects) {
  if (!projectTable) {
    return;
  }

  const headerRow = `
    <div class="project-row header-row">
      <span>Projet</span>
      <span>Service</span>
      <span>Responsable</span>
      <span>Statut</span>
    </div>
  `;

  const rows = projects
    .map((project) => {
      const statusClass =
        project.status === "done"
          ? "done"
          : project.status === "review"
            ? "review"
            : "live";

      const statusLabel =
        project.status === "done"
          ? "Livre"
          : project.status === "review"
            ? "Validation"
            : "En cours";

      return `
        <div class="project-row">
          <span>${project.name}</span>
          <span>${project.service}</span>
          <span>${project.owner}</span>
          <span class="status ${statusClass}">${statusLabel}</span>
        </div>
      `;
    })
    .join("");

  projectTable.innerHTML = headerRow + rows;
}

function renderSchedule(items) {
  if (!scheduleList) {
    return;
  }

  scheduleList.innerHTML = items
    .map((item) => `<li><strong>${item.dayLabel}</strong><span>${item.title}</span></li>`)
    .join("");
}

function renderLeads(leads) {
  if (!leadList) {
    return;
  }

  leadList.innerHTML = leads
    .map(
      (lead) => `
        <div class="lead-card">
          <strong>${lead.companyName}</strong>
          <span>Besoin: ${lead.needSummary}</span>
        </div>
      `
    )
    .join("");
}

function renderActivities(activities) {
  if (!activityFeed) {
    return;
  }

  activityFeed.innerHTML = activities
    .map(
      (item) => `
        <div class="activity-item">
          <strong>${item.happenedAt}</strong>
          <p>${item.message}</p>
        </div>
      `
    )
    .join("");
}

function renderRoleView(roleView) {
  if (!roleView) {
    return;
  }

  if (staffRoleSummary) {
    staffRoleSummary.textContent = roleView.summary;
  }

  if (focusLabel) {
    focusLabel.textContent = roleView.focusLabel;
  }

  if (focusTitle) {
    focusTitle.textContent = roleView.focusTitle;
  }

  if (focusBadge) {
    focusBadge.textContent = roleView.focusBadge;
  }

  if (quickActionsTitle) {
    quickActionsTitle.textContent = roleView.quickActionsTitle;
  }

  if (activityTitle) {
    activityTitle.textContent = roleView.activityTitle;
  }

  if (myWorkTitle) {
    myWorkTitle.textContent = roleView.myWorkTitle;
  }

  if (roleFocusList) {
    roleFocusList.innerHTML = (roleView.focusItems || [])
      .map(
        (item) => `
          <div class="activity-item">
            <strong>${item.title}</strong>
            <p>${item.text}</p>
          </div>
        `
      )
      .join("");
  }

  if (quickActionsList) {
    quickActionsList.innerHTML = (roleView.quickActions || [])
      .map(
        (item) => `
          <article class="stack-card">
            <div class="stack-head">
              <strong>${item.title}</strong>
              <span class="status-chip">${item.status}</span>
            </div>
            <p>${item.text}</p>
          </article>
        `
      )
      .join("");
  }
}

function renderMyTasks(tasks) {
  if (!myWorkList) {
    return;
  }

  myWorkList.innerHTML = tasks
    .map(
      (task) => `
        <article class="stack-card">
          <div class="stack-head">
            <strong>${task.title}</strong>
            <span class="status-chip">${statusLabel(task.status)}</span>
          </div>
          <p>${task.projectName || "Sans projet"}</p>
          <small>Priorite: ${priorityLabel(task.priority)} · Echeance: ${task.dueDate || "-"}</small>
        </article>
      `
    )
    .join("");
}

function renderOverview(payload, warning) {
  const { metrics, projects, content, leads, activities, source, roleView, myTasks } = payload;

  if (metricProjects) {
    metricProjects.textContent = `${metrics.activeProjects} projets actifs`;
  }

  if (metricProjectsCopy) {
    metricProjectsCopy.textContent =
      source === "database"
        ? "Indicateurs calcules depuis la base MySQL."
        : "Affichage temporaire via donnees de secours.";
  }

  if (metricTasks) {
    metricTasks.textContent = `${metrics.openTasks} taches`;
  }

  if (metricContent) {
    metricContent.textContent = `${metrics.scheduledContent} contenus`;
  }

  if (metricLeads) {
    metricLeads.textContent = `${metrics.openLeads} leads`;
  }

  if (dashboardSource) {
    dashboardSource.textContent = warning
      ? `${warning}.`
      : source === "database"
        ? "Connecte a la base MySQL."
        : "Mode de secours actif.";
  }

  renderProjects(projects || []);
  renderSchedule(content || []);
  renderLeads(leads || []);
  renderActivities(activities || []);
  renderRoleView(roleView);
  renderMyTasks(myTasks || []);
}

async function loadDashboard() {
  try {
    await ensureStaffSession();

    const response = await fetch("/api/dashboard/overview");
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || "Unable to load dashboard");
    }

    renderOverview(payload.data, payload.warning);
  } catch (_error) {
    if (dashboardSource) {
      dashboardSource.textContent = "API indisponible ou session invalide.";
    }
  }
}

loadDashboard();
