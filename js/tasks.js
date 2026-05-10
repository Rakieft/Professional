const taskForm = document.getElementById("task-form");
const taskFormTitle = document.getElementById("task-form-title");
const taskSubmitButton = document.getElementById("task-submit-button");
const taskCancelButton = document.getElementById("task-cancel-button");
const taskFeedback = document.getElementById("task-feedback");
const taskList = document.getElementById("task-list");
const taskId = document.getElementById("task-id");
const taskTitle = document.getElementById("task-title");
const taskProject = document.getElementById("task-project");
const taskAssignee = document.getElementById("task-assignee");
const taskStatus = document.getElementById("task-status");
const taskPriority = document.getElementById("task-priority");
const taskDue = document.getElementById("task-due");
const taskDescription = document.getElementById("task-description");
const taskFilterStatus = document.getElementById("task-filter-status");
const taskFilterPriority = document.getElementById("task-filter-priority");
const taskFilterAssignee = document.getElementById("task-filter-assignee");
const tasksTotal = document.getElementById("tasks-total");
const tasksInProgress = document.getElementById("tasks-in-progress");
const tasksHighPriority = document.getElementById("tasks-high-priority");
let currentUser = null;

let projectsCache = [];
let usersCache = [];
let tasksCache = [];

function fillSelect(select, items, labelKey, valueKey, emptyLabel) {
  select.innerHTML = `<option value="">${emptyLabel}</option>` +
    items.map((item) => `<option value="${item[valueKey]}">${item[labelKey]}</option>`).join("");
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

function resetTaskForm() {
  taskForm.reset();
  taskId.value = "";
  taskFormTitle.textContent = "Ajouter une action";
  taskSubmitButton.textContent = "Creer la tache";
  taskFeedback.textContent = "Ajoutez une tache rattachee a un projet pour structurer la production.";
}

function canManageTasks() {
  const roleName = currentUser?.roleName || "";
  return ["admin", "operations_manager", "project_manager"].includes(roleName);
}

function findTaskById(id) {
  return tasksCache.find((task) => String(task.id) === String(id));
}

function startEditTask(id) {
  const task = findTaskById(id);

  if (!task) {
    return;
  }

  taskId.value = task.id;
  taskTitle.value = task.title || "";
  taskDescription.value = task.description || "";
  taskStatus.value = task.status || "todo";
  taskPriority.value = task.priority || "medium";
  taskDue.value = task.dueDate || "";

  const projectMatch = projectsCache.find((project) => project.name === task.projectName);
  const assigneeMatch = usersCache.find((user) => user.fullName === task.assigneeName);

  taskProject.value = projectMatch ? String(projectMatch.id) : "";
  taskAssignee.value = assigneeMatch ? String(assigneeMatch.id) : "";

  taskFormTitle.textContent = "Modifier la tache";
  taskSubmitButton.textContent = "Enregistrer les changements";
  taskFeedback.textContent = "Vous etes en train de modifier une tache existante.";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function changeTaskStatus(id, status) {
  const response = await fetch(`/api/tasks/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Unable to update task status");
  }

  await loadTasks();
}

async function removeTask(id) {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "DELETE"
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Unable to delete task");
  }

  if (String(taskId.value) === String(id)) {
    resetTaskForm();
  }

  await loadTasks();
}

function renderTasks(tasks) {
  tasksCache = tasks;

  const filteredTasks = tasks.filter((task) => {
    const statusMatch = !taskFilterStatus.value || task.status === taskFilterStatus.value;
    const priorityMatch = !taskFilterPriority.value || task.priority === taskFilterPriority.value;
    const assigneeMatch = !taskFilterAssignee.value || String(task.assigneeUserId || "") === taskFilterAssignee.value;

    return statusMatch && priorityMatch && assigneeMatch;
  });

  tasksTotal.textContent = `${tasks.length} taches`;
  tasksInProgress.textContent = `${tasks.filter((task) => task.status === "in_progress").length} actions`;
  tasksHighPriority.textContent = `${tasks.filter((task) => task.priority === "high" && task.status !== "done").length} urgences`;

  const showManagementActions = canManageTasks();

  taskList.innerHTML = filteredTasks
    .map(
      (task) => `
        <article class="stack-card">
          <div class="stack-head">
            <strong>${task.title}</strong>
            <span class="status-chip">${statusLabel(task.status)}</span>
          </div>
          <p>${task.projectName || "Sans projet"} · ${task.assigneeName || "Sans responsable"}${task.assigneeRole ? ` · ${task.assigneeRole}` : ""}</p>
          <small>Priorite: ${priorityLabel(task.priority)} · Echeance: ${task.dueDate || "-"}${task.assigneeJobTitle ? ` · Poste: ${task.assigneeJobTitle}` : ""}</small>
          <div class="stack-actions">
            ${showManagementActions ? `<button class="mini-btn" data-edit-task="${task.id}" type="button">Modifier</button>` : ""}
            <button class="mini-btn success" data-status-task="${task.id}" data-status-value="done" type="button">Marquer termine</button>
            <button class="mini-btn warn" data-status-task="${task.id}" data-status-value="review" type="button">Passer en validation</button>
            ${showManagementActions ? `<button class="mini-btn danger" data-delete-task="${task.id}" type="button">Supprimer</button>` : ""}
          </div>
        </article>
      `
    )
    .join("");

  taskList.querySelectorAll("[data-edit-task]").forEach((button) => {
    button.addEventListener("click", () => {
      startEditTask(button.dataset.editTask);
    });
  });

  taskList.querySelectorAll("[data-status-task]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await changeTaskStatus(button.dataset.statusTask, button.dataset.statusValue);
        taskFeedback.textContent = "Statut de la tache mis a jour.";
      } catch (error) {
        taskFeedback.textContent = error.message;
      }
    });
  });

  taskList.querySelectorAll("[data-delete-task]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await removeTask(button.dataset.deleteTask);
        taskFeedback.textContent = "Tache supprimee.";
      } catch (error) {
        taskFeedback.textContent = error.message;
      }
    });
  });
}

async function loadTaskMeta() {
  const [metaResponse, projectResponse] = await Promise.all([
    fetch("/api/meta"),
    fetch("/api/projects")
  ]);

  const metaPayload = await metaResponse.json();
  const projectPayload = await projectResponse.json();

  projectsCache = projectPayload.data || [];
  usersCache = metaPayload.data.users || [];

  fillSelect(taskProject, projectsCache, "name", "id", "Choisir un projet");
  fillSelect(taskAssignee, usersCache, "fullName", "id", "Choisir un responsable");
  fillSelect(taskFilterAssignee, usersCache, "fullName", "id", "Tous");

  if (!canManageTasks()) {
    taskProject.disabled = true;
    taskAssignee.disabled = true;
    taskStatus.disabled = true;
    taskPriority.disabled = true;
    taskDue.disabled = true;
    taskDescription.disabled = true;
    taskTitle.disabled = true;
    taskSubmitButton.disabled = true;
    taskSubmitButton.textContent = "Gestion reservee aux managers";
    taskFeedback.textContent = "Vous voyez principalement vos propres taches. Le pilotage complet est reserve aux roles manageriaux.";
    taskFormTitle.textContent = "Vue personnelle des taches";
  }
}

async function loadTasks() {
  const response = await fetch("/api/tasks");
  const payload = await response.json();
  renderTasks(payload.data || []);
}

if (taskCancelButton) {
  taskCancelButton.addEventListener("click", () => {
    resetTaskForm();
  });
}

if (taskForm) {
  taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(taskForm).entries());
    const isEdit = Boolean(payload.id);

    try {
      const response = await fetch(isEdit ? `/api/tasks/${payload.id}` : "/api/tasks", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to save task");
      }

      resetTaskForm();
      taskFeedback.textContent = isEdit ? "Tache mise a jour avec succes." : "Tache creee avec succes.";
      await loadTaskMeta();
      await loadTasks();
    } catch (error) {
      taskFeedback.textContent = error.message;
    }
  });
}

[taskFilterStatus, taskFilterPriority, taskFilterAssignee].forEach((select) => {
  if (select) {
    select.addEventListener("change", () => {
      renderTasks(tasksCache);
    });
  }
});

(async () => {
  currentUser = await ensureStaffSession();
  await loadTaskMeta();
  await loadTasks();
})();

