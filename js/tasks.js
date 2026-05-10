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
const taskDetailSummary = document.getElementById("task-detail-summary");
const taskCommentForm = document.getElementById("task-comment-form");
const taskCommentMessage = document.getElementById("task-comment-message");
const taskCommentFeedback = document.getElementById("task-comment-feedback");
const taskCommentsList = document.getElementById("task-comments-list");
const taskFileForm = document.getElementById("task-file-form");
const taskFileFeedback = document.getElementById("task-file-feedback");
const taskFilesList = document.getElementById("task-files-list");

const kanbanColumns = {
  todo: document.getElementById("kanban-todo"),
  in_progress: document.getElementById("kanban-in-progress"),
  review: document.getElementById("kanban-review"),
  done: document.getElementById("kanban-done")
};

const kanbanCounters = {
  todo: document.getElementById("kanban-count-todo"),
  in_progress: document.getElementById("kanban-count-in-progress"),
  review: document.getElementById("kanban-count-review"),
  done: document.getElementById("kanban-count-done")
};

let currentUser = null;
let projectsCache = [];
let usersCache = [];
let tasksCache = [];
let selectedTaskId = null;
let draggedTaskId = null;

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

function canManageTasks() {
  const roleName = currentUser?.roleName || "";
  return ["admin", "operations_manager", "project_manager"].includes(roleName);
}

function resetTaskForm() {
  taskForm.reset();
  taskId.value = "";
  taskFormTitle.textContent = "Ajouter une action";
  taskSubmitButton.textContent = "Creer la tache";
  taskFeedback.textContent = "Ajoutez une tache rattachee a un projet pour structurer la production.";
}

function findTaskById(id) {
  return tasksCache.find((task) => String(task.id) === String(id));
}

function getFilteredTasks(tasks) {
  return tasks.filter((task) => {
    const statusMatch = !taskFilterStatus.value || task.status === taskFilterStatus.value;
    const priorityMatch = !taskFilterPriority.value || task.priority === taskFilterPriority.value;
    const assigneeMatch = !taskFilterAssignee.value || String(task.assigneeUserId || "") === taskFilterAssignee.value;

    return statusMatch && priorityMatch && assigneeMatch;
  });
}

function updateTopStats(tasks) {
  tasksTotal.textContent = `${tasks.length} taches`;
  tasksInProgress.textContent = `${tasks.filter((task) => task.status === "in_progress").length} actions`;
  tasksHighPriority.textContent = `${tasks.filter((task) => task.priority === "high" && task.status !== "done").length} urgences`;
}

function renderTaskList(tasks) {
  const showManagementActions = canManageTasks();

  taskList.innerHTML = tasks.map((task) => `
    <article class="stack-card ${String(selectedTaskId) === String(task.id) ? "is-selected" : ""}">
      <div class="stack-head">
        <strong>${task.title}</strong>
        <span class="status-chip">${statusLabel(task.status)}</span>
      </div>
      <p>${task.projectName || "Sans projet"} | ${task.assigneeName || "Sans responsable"}${task.assigneeRole ? ` | ${task.assigneeRole}` : ""}</p>
      <small>Priorite: ${priorityLabel(task.priority)} | Echeance: ${task.dueDate || "-"} | Commentaires: ${task.commentCount || 0} | Fichiers: ${task.fileCount || 0}</small>
      <div class="stack-actions">
        <button class="mini-btn" data-open-task="${task.id}" type="button">Ouvrir</button>
        ${showManagementActions ? `<button class="mini-btn" data-edit-task="${task.id}" type="button">Modifier</button>` : ""}
        <button class="mini-btn success" data-status-task="${task.id}" data-status-value="done" type="button">Marquer termine</button>
        <button class="mini-btn warn" data-status-task="${task.id}" data-status-value="review" type="button">Passer en validation</button>
        ${showManagementActions ? `<button class="mini-btn danger" data-delete-task="${task.id}" type="button">Supprimer</button>` : ""}
      </div>
    </article>
  `).join("");

  bindTaskActionButtons(taskList);
}

function renderKanban(tasks) {
  Object.values(kanbanColumns).forEach((column) => {
    column.innerHTML = "";
  });

  ["todo", "in_progress", "review", "done"].forEach((status) => {
    const columnTasks = tasks.filter((task) => task.status === status);
    kanbanCounters[status].textContent = String(columnTasks.length);

    if (!columnTasks.length) {
      kanbanColumns[status].innerHTML = `<article class="kanban-card empty"><p>Aucune tache ici pour l'instant.</p></article>`;
      return;
    }

    kanbanColumns[status].innerHTML = columnTasks.map((task) => `
      <article class="kanban-card ${String(selectedTaskId) === String(task.id) ? "active" : ""}" data-open-task="${task.id}" data-task-id="${task.id}" draggable="true">
        <div class="stack-head">
          <strong>${task.title}</strong>
          <span class="status-chip">${priorityLabel(task.priority)}</span>
        </div>
        <p>${task.projectName || "Sans projet"}</p>
        <small>${task.assigneeName || "Sans responsable"} | ${task.dueDate || "Sans echeance"}</small>
        <div class="kanban-meta">
          <span>${task.commentCount || 0} commentaires</span>
          <span>${task.fileCount || 0} fichiers</span>
        </div>
      </article>
    `).join("");
  });

  Object.values(kanbanColumns).forEach((column) => {
    column.querySelectorAll("[data-open-task]").forEach((card) => {
      card.addEventListener("click", () => openTaskDetail(card.dataset.openTask));
      card.addEventListener("dragstart", (event) => {
        if (!canManageTasks()) {
          event.preventDefault();
          return;
        }

        draggedTaskId = card.dataset.taskId;
        card.classList.add("dragging");
        event.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("dragend", () => {
        draggedTaskId = null;
        card.classList.remove("dragging");
      });
    });
  });

  Object.entries(kanbanColumns).forEach(([status, column]) => {
    column.addEventListener("dragover", (event) => {
      if (!canManageTasks()) {
        return;
      }

      event.preventDefault();
      column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", () => {
      column.classList.remove("drag-over");
    });

    column.addEventListener("drop", async (event) => {
      if (!canManageTasks()) {
        return;
      }

      event.preventDefault();
      column.classList.remove("drag-over");

      if (!draggedTaskId) {
        return;
      }

      const task = findTaskById(draggedTaskId);

      if (!task || task.status === status) {
        return;
      }

      try {
        await changeTaskStatus(draggedTaskId, status);
        taskFeedback.textContent = "Tache deplacee dans le Kanban.";
      } catch (error) {
        taskFeedback.textContent = error.message;
      }
    });
  });
}

function bindTaskActionButtons(container) {
  container.querySelectorAll("[data-open-task]").forEach((button) => {
    button.addEventListener("click", () => openTaskDetail(button.dataset.openTask));
  });

  container.querySelectorAll("[data-edit-task]").forEach((button) => {
    button.addEventListener("click", () => startEditTask(button.dataset.editTask));
  });

  container.querySelectorAll("[data-status-task]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await changeTaskStatus(button.dataset.statusTask, button.dataset.statusValue);
        taskFeedback.textContent = "Statut de la tache mis a jour.";
      } catch (error) {
        taskFeedback.textContent = error.message;
      }
    });
  });

  container.querySelectorAll("[data-delete-task]").forEach((button) => {
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

function renderTasks(tasks) {
  tasksCache = tasks;
  updateTopStats(tasks);

  const filteredTasks = getFilteredTasks(tasks);
  renderTaskList(filteredTasks);
  renderKanban(filteredTasks);
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

async function openTaskDetail(id) {
  selectedTaskId = id;
  renderTasks(tasksCache);

  const response = await fetch(`/api/tasks/${id}/detail`);
  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    taskCommentFeedback.textContent = payload.message || "Impossible de charger la tache";
    taskFileFeedback.textContent = payload.message || "Impossible de charger la tache";
    return;
  }

  const { task, comments, files } = payload.data;

  taskDetailSummary.innerHTML = `
    <article class="stack-card">
      <div class="stack-head">
        <strong>${task.title}</strong>
        <span class="status-chip">${statusLabel(task.status)}</span>
      </div>
      <p>${task.description || "Aucune description pour cette tache."}</p>
      <small>${task.projectName || "Sans projet"} | ${task.assigneeName || "Sans responsable"} | Priorite ${priorityLabel(task.priority)} | Echeance ${task.dueDate || "-"}</small>
    </article>
  `;

  taskCommentsList.innerHTML = comments.length
    ? comments.map((comment) => `
      <article class="stack-card">
        <div class="stack-head">
          <strong>${comment.authorName}</strong>
          <span class="status-chip">${comment.authorRole}</span>
        </div>
        <p>${comment.message}</p>
        <small>${comment.createdAt}</small>
      </article>
    `).join("")
    : `<article class="stack-card"><p>Aucun commentaire sur cette tache pour le moment.</p></article>`;

  taskFilesList.innerHTML = files.length
    ? files.map((file) => `
      <article class="stack-card">
        <div class="stack-head">
          <strong>${file.fileName}</strong>
          <span class="status-chip">${file.fileKind || "fichier"}</span>
        </div>
        <p>${file.notes || "Aucune note ajoutee."}</p>
        <small>${file.authorName} | ${file.createdAt}</small>
        <div class="stack-actions">
          <a class="mini-btn" href="${file.fileUrl}" target="_blank" rel="noopener noreferrer">Ouvrir le lien</a>
        </div>
      </article>
    `).join("")
    : `<article class="stack-card"><p>Aucun fichier ou lien rattache a cette tache.</p></article>`;

  taskCommentFeedback.textContent = "Utilisez les commentaires pour le contexte, les retours ou les validations.";
  taskFileFeedback.textContent = "Ajoutez ici des references, briefs, livrables ou ressources de travail.";
}

async function changeTaskStatus(id, status) {
  const response = await fetch(`/api/tasks/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Impossible de mettre a jour le statut");
  }

  await loadTasks();

  if (String(selectedTaskId) === String(id)) {
    await openTaskDetail(id);
  }
}

async function removeTask(id) {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "DELETE"
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Impossible de supprimer la tache");
  }

  if (String(taskId.value) === String(id)) {
    resetTaskForm();
  }

  if (String(selectedTaskId) === String(id)) {
    selectedTaskId = null;
    taskDetailSummary.innerHTML = `
      <article class="stack-card">
        <div class="stack-head">
          <strong>Aucune tache selectionnee</strong>
          <span class="status-chip">attente</span>
        </div>
        <p>Cliquez sur une carte dans le Kanban pour ouvrir le contexte, les commentaires et les fichiers.</p>
      </article>
    `;
    taskCommentsList.innerHTML = "";
    taskFilesList.innerHTML = "";
  }

  await loadTasks();
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
        throw new Error(result.message || "Impossible de sauvegarder la tache");
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

if (taskCommentForm) {
  taskCommentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!selectedTaskId) {
      taskCommentFeedback.textContent = "Selectionnez d'abord une tache.";
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${selectedTaskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: taskCommentMessage.value })
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Impossible d'ajouter le commentaire");
      }

      taskCommentMessage.value = "";
      taskCommentFeedback.textContent = "Commentaire ajoute.";
      await loadTasks();
      await openTaskDetail(selectedTaskId);
    } catch (error) {
      taskCommentFeedback.textContent = error.message;
    }
  });
}

if (taskFileForm) {
  taskFileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!selectedTaskId) {
      taskFileFeedback.textContent = "Selectionnez d'abord une tache.";
      return;
    }

    const payload = Object.fromEntries(new FormData(taskFileForm).entries());

    try {
      const response = await fetch(`/api/tasks/${selectedTaskId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Impossible d'ajouter le fichier");
      }

      taskFileForm.reset();
      taskFileFeedback.textContent = "Fichier ajoute.";
      await loadTasks();
      await openTaskDetail(selectedTaskId);
    } catch (error) {
      taskFileFeedback.textContent = error.message;
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
