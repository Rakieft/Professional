const teamForm = document.getElementById("team-form");
const teamFormTitle = document.getElementById("team-form-title");
const teamSubmitButton = document.getElementById("team-submit-button");
const teamCancelButton = document.getElementById("team-cancel-button");
const teamFeedback = document.getElementById("team-feedback");
const teamList = document.getElementById("team-list");
const teamId = document.getElementById("team-id");
const teamFullName = document.getElementById("team-full-name");
const teamEmail = document.getElementById("team-email");
const teamRole = document.getElementById("team-role");
const teamJobTitle = document.getElementById("team-job-title");
const teamPassword = document.getElementById("team-password");
const teamTotal = document.getElementById("team-total");
const teamActive = document.getElementById("team-active");
const teamRoles = document.getElementById("team-roles");

let usersCache = [];
let rolesCache = [];

function fillRoleSelect() {
  teamRole.innerHTML = '<option value="">Choisir un role</option>' +
    rolesCache.map((role) => `<option value="${role.id}">${role.name}</option>`).join("");
}

function resetTeamForm() {
  teamForm.reset();
  teamId.value = "";
  teamFormTitle.textContent = "Ajouter un compte staff";
  teamSubmitButton.textContent = "Creer le membre";
  teamPassword.required = true;
  teamFeedback.textContent = "Commencez par creer les comptes reels du staff avec un role et un poste clair.";
}

function setTeamStats(users) {
  const activeCount = users.filter((user) => Number(user.isActive) === 1).length;
  teamTotal.textContent = `${users.length} membres`;
  teamActive.textContent = `${activeCount} comptes`;
  teamRoles.textContent = `${rolesCache.length} roles`;
}

function startEditUser(id) {
  const user = usersCache.find((entry) => String(entry.id) === String(id));

  if (!user) {
    return;
  }

  teamId.value = user.id;
  teamFullName.value = user.fullName || "";
  teamEmail.value = user.email || "";
  teamRole.value = user.roleId ? String(user.roleId) : "";
  teamJobTitle.value = user.jobTitle || "";
  teamPassword.value = "";
  teamPassword.required = false;
  teamFormTitle.textContent = "Modifier le membre";
  teamSubmitButton.textContent = "Enregistrer";
  teamFeedback.textContent = "Vous modifiez un membre existant. Laissez le mot de passe vide si vous ne voulez pas le changer.";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function toggleUserStatus(id, isActive) {
  const response = await fetch(`/api/users/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive })
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Impossible de changer le statut");
  }

  await loadUsers();
}

function renderUsers(users) {
  usersCache = users;
  setTeamStats(users);

  teamList.innerHTML = users.map((user) => `
    <article class="stack-card">
      <div class="stack-head">
        <strong>${user.fullName}</strong>
        <span class="status-chip">${Number(user.isActive) === 1 ? "Actif" : "Inactif"}</span>
      </div>
      <p>${user.roleName || "staff"} · ${user.jobTitle || "Poste non precise"}</p>
      <small>${user.email}</small>
      <div class="stack-actions">
        <button class="mini-btn" data-edit-user="${user.id}" type="button">Modifier</button>
        <button class="mini-btn ${Number(user.isActive) === 1 ? "warn" : "success"}" data-toggle-user="${user.id}" data-toggle-value="${Number(user.isActive) === 1 ? "0" : "1"}" type="button">
          ${Number(user.isActive) === 1 ? "Desactiver" : "Activer"}
        </button>
      </div>
    </article>
  `).join("");

  teamList.querySelectorAll("[data-edit-user]").forEach((button) => {
    button.addEventListener("click", () => startEditUser(button.dataset.editUser));
  });

  teamList.querySelectorAll("[data-toggle-user]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await toggleUserStatus(button.dataset.toggleUser, button.dataset.toggleValue === "1");
        teamFeedback.textContent = "Statut du compte mis a jour.";
      } catch (error) {
        teamFeedback.textContent = error.message;
      }
    });
  });
}

async function loadMeta() {
  const response = await fetch("/api/meta");
  const payload = await response.json();
  rolesCache = payload.data.roles || [];
  fillRoleSelect();
}

async function loadUsers() {
  const response = await fetch("/api/users");
  const payload = await response.json();
  renderUsers(payload.data || []);
}

teamCancelButton.addEventListener("click", resetTeamForm);

teamForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(teamForm).entries());
  const isEdit = Boolean(payload.id);

  if (isEdit && !payload.password) {
    delete payload.password;
  }

  try {
    const response = await fetch(isEdit ? `/api/users/${payload.id}` : "/api/users", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Impossible de sauvegarder le membre");
    }

    resetTeamForm();
    teamFeedback.textContent = isEdit ? "Membre mis a jour avec succes." : "Membre cree avec succes.";
    await loadMeta();
    await loadUsers();
  } catch (error) {
    teamFeedback.textContent = error.message;
  }
});

(async () => {
  await ensureStaffSession();
  await loadMeta();
  await loadUsers();
})();
