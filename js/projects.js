const projectForm = document.getElementById("project-form");
const projectFeedback = document.getElementById("project-feedback");
const projectList = document.getElementById("project-list");
const projectClient = document.getElementById("project-client");
const projectService = document.getElementById("project-service");
const projectOwner = document.getElementById("project-owner");
let currentUser = null;

function canManageProjects() {
  const roleName = currentUser?.roleName || "";
  return ["admin", "operations_manager", "project_manager"].includes(roleName);
}

function fillSelect(select, items, labelKey, valueKey, emptyLabel) {
  select.innerHTML = `<option value="">${emptyLabel}</option>` +
    items.map((item) => `<option value="${item[valueKey]}">${item[labelKey]}</option>`).join("");
}

function renderProjects(projects) {
  projectList.innerHTML = projects
    .map(
      (project) => `
        <article class="stack-card">
          <div class="stack-head">
            <strong>${project.name}</strong>
            <span class="status-chip">${project.status}</span>
          </div>
          <p>${project.clientName || "Sans client"} | ${project.ownerName || "Sans responsable"}</p>
          <small>Priorite: ${project.priority}</small>
          <small>Debut: ${project.startDate || "-"} | Echeance: ${project.dueDate || "-"}</small>
        </article>
      `
    )
    .join("");
}

async function loadMeta() {
  const response = await fetch("/api/meta");
  const payload = await response.json();
  const { services, users } = payload.data;

  const clientsResponse = await fetch("/api/clients");
  const clientsPayload = await clientsResponse.json();

  fillSelect(projectClient, clientsPayload.data || [], "name", "id", "Choisir un client");
  fillSelect(projectService, services || [], "name", "id", "Choisir un service");
  fillSelect(projectOwner, users || [], "fullName", "id", "Choisir un responsable");
}

async function loadProjects() {
  const response = await fetch("/api/projects");
  const payload = await response.json();
  renderProjects(payload.data || []);
}

if (projectForm) {
  projectForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(projectForm).entries());

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to create project");
      }

      projectForm.reset();
      projectFeedback.textContent = "Projet cree avec succes.";
      await loadMeta();
      await loadProjects();
    } catch (error) {
      projectFeedback.textContent = error.message;
    }
  });
}

(async () => {
  currentUser = await ensureStaffSession();
  await loadMeta();

  if (!canManageProjects() && projectForm) {
    Array.from(projectForm.elements).forEach((field) => {
      if (field.tagName === "BUTTON") {
        field.disabled = true;
        field.textContent = "Creation reservee aux managers";
      } else {
        field.disabled = true;
      }
    });

    projectFeedback.textContent = "Vous pouvez consulter les projets, mais la creation est reservee aux roles manageriaux.";
  }

  await loadProjects();
})();
