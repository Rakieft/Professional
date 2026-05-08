const taskForm = document.getElementById("task-form");
const taskFeedback = document.getElementById("task-feedback");
const taskList = document.getElementById("task-list");
const taskProject = document.getElementById("task-project");
const taskAssignee = document.getElementById("task-assignee");

function fillSelect(select, items, labelKey, valueKey, emptyLabel) {
  select.innerHTML = `<option value="">${emptyLabel}</option>` +
    items.map((item) => `<option value="${item[valueKey]}">${item[labelKey]}</option>`).join("");
}

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

function renderTasks(tasks) {
  taskList.innerHTML = tasks
    .map(
      (task) => `
        <article class="stack-card">
          <div class="stack-head">
            <strong>${task.title}</strong>
            <span class="status-chip">${statusLabel(task.status)}</span>
          </div>
          <p>${task.projectName || "Sans projet"} · ${task.assigneeName || "Sans responsable"}</p>
          <small>Priorite: ${task.priority} · Echeance: ${task.dueDate || "-"}</small>
        </article>
      `
    )
    .join("");
}

async function loadTaskMeta() {
  const [metaResponse, projectResponse] = await Promise.all([
    fetch("/api/meta"),
    fetch("/api/projects")
  ]);

  const metaPayload = await metaResponse.json();
  const projectPayload = await projectResponse.json();

  fillSelect(taskProject, projectPayload.data || [], "name", "id", "Choisir un projet");
  fillSelect(taskAssignee, metaPayload.data.users || [], "fullName", "id", "Choisir un responsable");
}

async function loadTasks() {
  const response = await fetch("/api/tasks");
  const payload = await response.json();
  renderTasks(payload.data || []);
}

if (taskForm) {
  taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(taskForm).entries());

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to create task");
      }

      taskForm.reset();
      taskFeedback.textContent = "Tache creee avec succes.";
      await loadTaskMeta();
      await loadTasks();
    } catch (error) {
      taskFeedback.textContent = error.message;
    }
  });
}

(async () => {
  await ensureStaffSession();
  await loadTaskMeta();
  await loadTasks();
})();
