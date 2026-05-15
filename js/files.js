const projectFileForm = document.getElementById("project-file-form");
const projectFileId = document.getElementById("project-file-id");
const projectFileProject = document.getElementById("project-file-project");
const projectFileFeedback = document.getElementById("project-file-feedback");
const projectFileSubmit = document.getElementById("project-file-submit");
const projectFileCancel = document.getElementById("project-file-cancel");
const filesFilterSearch = document.getElementById("files-filter-search");
const filesFilterProject = document.getElementById("files-filter-project");
const filesFilterVisibility = document.getElementById("files-filter-visibility");
const projectFilesSummary = document.getElementById("project-files-summary");
const projectFilesList = document.getElementById("project-files-list");
const filesTotal = document.getElementById("files-total");
const filesInternal = document.getElementById("files-internal");
const filesClient = document.getElementById("files-client");
const filesReference = document.getElementById("files-reference");

let currentUser = null;
let filesCache = [];
let projectsCache = [];
let filesSummaryCache = {};

function canManageFiles() {
  const roleName = currentUser?.roleName || "";
  return [
    "admin",
    "operations_manager",
    "project_manager",
    "designer",
    "developer",
    "content_creator",
    "social_media_manager",
    "sales_manager",
    "support_manager"
  ].includes(roleName);
}

function fillSelect(select, items, emptyLabel) {
  select.innerHTML = `<option value="">${emptyLabel}</option>` +
    items.map((item) => `<option value="${item.id}">${item.name}</option>`).join("");
}

function resetFileForm() {
  projectFileForm.reset();
  projectFileId.value = "";
  projectFileSubmit.textContent = "Ajouter le fichier";
  projectFileFeedback.textContent = "Ajoutez ici les livrables et ressources utiles a l'equipe et aux projets.";
}

function getFilteredFiles(files) {
  const search = (filesFilterSearch?.value || "").trim().toLowerCase();
  const visibility = filesFilterVisibility?.value || "";
  const projectId = filesFilterProject?.value || "";

  return files.filter((file) => {
    const haystack = `${file.fileName || ""} ${file.projectName || ""} ${file.authorName || ""} ${file.fileKind || ""}`.toLowerCase();
    const searchMatch = !search || haystack.includes(search);
    const visibilityMatch = !visibility || file.visibility === visibility;
    const projectMatch = !projectId || String(file.projectId) === String(projectId);

    return searchMatch && visibilityMatch && projectMatch;
  });
}

function renderStats(summary = {}) {
  filesTotal.textContent = `${summary.total || 0} fichier(s)`;
  filesInternal.textContent = `${summary.internal || 0} element(s)`;
  filesClient.textContent = `${summary.client || 0} livrable(s)`;
  filesReference.textContent = `${summary.reference || 0} source(s)`;
}

function renderSummary(summary = {}) {
  const kinds = Object.entries(summary.kinds || {});

  projectFilesSummary.innerHTML = `
    <article class="stack-card">
      <div class="stack-head">
        <strong>Repartition rapide</strong>
        <span class="status-chip">bibliotheque</span>
      </div>
      <p>Interne: ${summary.internal || 0} | Client: ${summary.client || 0} | Reference: ${summary.reference || 0}</p>
      <small>${kinds.length ? kinds.map(([kind, count]) => `${kind}: ${count}`).join(" | ") : "Aucun type encore renseigne."}</small>
    </article>
  `;
}

function startEditFile(id) {
  const file = filesCache.find((item) => String(item.id) === String(id));

  if (!file) {
    return;
  }

  projectFileId.value = file.id;
  projectFileProject.value = String(file.projectId || "");
  document.getElementById("project-file-name").value = file.fileName || "";
  document.getElementById("project-file-kind").value = file.fileKind || "";
  document.getElementById("project-file-visibility").value = file.visibility || "internal";
  document.getElementById("project-file-url").value = file.fileUrl || "";
  document.getElementById("project-file-notes").value = file.notes || "";
  projectFileSubmit.textContent = "Enregistrer les changements";
  projectFileFeedback.textContent = "Vous modifiez un livrable existant.";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderFiles(files) {
  if (!files.length) {
    projectFilesList.innerHTML = `
      <article class="stack-card">
        <div class="stack-head">
          <strong>Aucun fichier pour le moment</strong>
          <span class="status-chip">bibliotheque</span>
        </div>
        <p>Les livrables, maquettes, briefs et references ajoutes par l'equipe apparaitront ici.</p>
      </article>
    `;
    return;
  }

  projectFilesList.innerHTML = files.map((file) => `
    <article class="stack-card">
      <div class="stack-head">
        <strong>${file.fileName}</strong>
        <span class="status-chip">${file.visibility}</span>
      </div>
      <p>${file.projectName || "Sans projet"} | ${file.fileKind || "fichier"} | ${file.authorName || "Staff"}</p>
      <small>${file.createdAt}${file.notes ? ` | ${file.notes}` : ""}</small>
      <div class="stack-actions">
        <a class="mini-btn" href="${file.fileUrl}" target="_blank" rel="noopener noreferrer">Ouvrir</a>
        ${canManageFiles() ? `<button class="mini-btn warn" type="button" data-edit-file="${file.id}">Modifier</button>` : ""}
        ${canManageFiles() ? `<button class="mini-btn danger" type="button" data-delete-file="${file.id}">Supprimer</button>` : ""}
      </div>
    </article>
  `).join("");

  projectFilesList.querySelectorAll("[data-edit-file]").forEach((button) => {
    button.addEventListener("click", () => startEditFile(button.dataset.editFile));
  });

  projectFilesList.querySelectorAll("[data-delete-file]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const response = await fetch(`/api/files/${button.dataset.deleteFile}`, {
          method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Impossible de supprimer le fichier");
        }

        projectFileFeedback.textContent = "Livrable supprime avec succes.";
        await loadFiles();
      } catch (error) {
        projectFileFeedback.textContent = error.message;
      }
    });
  });
}

async function loadMeta() {
  const response = await fetch("/api/meta");
  const payload = await response.json();
  projectsCache = payload.data.projects || [];
  fillSelect(projectFileProject, projectsCache, "Choisir un projet");
  fillSelect(filesFilterProject, projectsCache, "Tous");
}

async function loadFiles() {
  const response = await fetch("/api/files");
  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || "Impossible de charger les fichiers");
  }

  filesCache = payload.data.files || [];
  filesSummaryCache = payload.data.summary || {};
  renderStats(payload.data.summary || {});
  renderSummary(payload.data.summary || {});
  renderFiles(getFilteredFiles(filesCache));
}

if (projectFileForm) {
  projectFileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(projectFileForm).entries());
    const isEdit = Boolean(payload.id);

    try {
      const response = await fetch(isEdit ? `/api/files/${payload.id}` : "/api/files", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Impossible d'ajouter le fichier");
      }

      resetFileForm();
      projectFileFeedback.textContent = isEdit ? "Livrable mis a jour avec succes." : "Fichier ajoute avec succes.";
      await loadFiles();
    } catch (error) {
      projectFileFeedback.textContent = error.message;
    }
  });
}

if (projectFileCancel) {
  projectFileCancel.addEventListener("click", () => {
    resetFileForm();
  });
}

[filesFilterSearch, filesFilterProject, filesFilterVisibility].forEach((element) => {
  if (!element) {
    return;
  }

  element.addEventListener(element.tagName === "INPUT" ? "input" : "change", () => {
    renderFiles(getFilteredFiles(filesCache));
  });
});

(async () => {
  currentUser = await ensureStaffSession();
  await loadMeta();

  if (!canManageFiles() && projectFileForm) {
    Array.from(projectFileForm.elements).forEach((field) => {
      if (field.tagName === "BUTTON") {
        field.disabled = true;
        field.textContent = "Ajout reserve au staff autorise";
      } else {
        field.disabled = true;
      }
    });

    projectFileFeedback.textContent = "Vous pouvez consulter la bibliotheque, mais l'ajout de livrables est limite aux roles de production, support et management.";
  }

  await loadFiles();
  resetFileForm();
})();
