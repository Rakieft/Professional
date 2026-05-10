const compensationForm = document.getElementById("compensation-form");
const compensationUser = document.getElementById("comp-user");
const compensationModel = document.getElementById("comp-model");
const compensationAmount = document.getElementById("comp-amount");
const compensationCurrency = document.getElementById("comp-currency");
const compensationNotes = document.getElementById("comp-notes");
const compensationFeedback = document.getElementById("comp-feedback");
const analyticsMonthlyPayroll = document.getElementById("analytics-monthly-payroll");
const analyticsSupportBudget = document.getElementById("analytics-support-budget");
const analyticsProjectCommitment = document.getElementById("analytics-project-commitment");
const analyticsVolunteers = document.getElementById("analytics-volunteers");
const analyticsAverageSalary = document.getElementById("analytics-average-salary");
const analyticsTable = document.getElementById("analytics-table");
const analyticsAlerts = document.getElementById("analytics-alerts");
const analyticsBusinessSnapshot = document.getElementById("analytics-business-snapshot");

let staffCache = [];

function money(amount, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function fillUserSelect(rows) {
  compensationUser.innerHTML = '<option value="">Choisir un membre</option>' +
    rows.map((row) => `<option value="${row.id}">${row.fullName} - ${row.roleName}</option>`).join("");
}

function renderSummary(summary) {
  analyticsMonthlyPayroll.textContent = money(summary.monthlyPayroll || 0);
  analyticsSupportBudget.textContent = money(summary.supportBudget || 0);
  analyticsProjectCommitment.textContent = money(summary.projectCommitment || 0);
  analyticsVolunteers.textContent = `${summary.volunteerCount || 0} poste(s)`;
  analyticsAverageSalary.textContent = `Salaire moyen: ${money(summary.averageSalary || 0)}`;

  analyticsBusinessSnapshot.innerHTML = `
    <article class="stack-card">
      <div class="stack-head">
        <strong>${summary.activeProjects || 0} projets actifs</strong>
        <span class="status-chip">delivery</span>
      </div>
      <p>${summary.openTasks || 0} tache(s) ouvertes, dont ${summary.overdueTasks || 0} en retard.</p>
    </article>
    <article class="stack-card">
      <div class="stack-head">
        <strong>${summary.pipelineLeads || 0} leads dans le pipeline</strong>
        <span class="status-chip">sales</span>
      </div>
      <p>${summary.wonLeads || 0} lead(s) gagnes et ${summary.deliveredProjects || 0} projet(s) deja livres.</p>
    </article>
    <article class="stack-card">
      <div class="stack-head">
        <strong>${summary.paidStaffCount || 0} poste(s) remunere(s)</strong>
        <span class="status-chip">team</span>
      </div>
      <p>${summary.activeStaffCount || 0} compte(s) actif(s) dans l'espace staff.</p>
    </article>
  `;
}

function renderAlerts(alerts) {
  analyticsAlerts.innerHTML = alerts.map((alert) => `
    <article class="stack-card">
      <div class="stack-head">
        <strong>${alert.title}</strong>
        <span class="status-chip">CEO</span>
      </div>
      <p>${alert.text}</p>
    </article>
  `).join("");
}

function renderTable(rows) {
  staffCache = rows;
  fillUserSelect(rows);

  analyticsTable.innerHTML = `
    <div class="project-row header-row">
      <span>Membre</span>
      <span>Role</span>
      <span>Modele</span>
      <span>Montant</span>
    </div>
    ${rows.map((row) => `
      <div class="project-row">
        <span>
          <strong>${row.fullName}</strong>
          <small>${row.jobTitle || "Poste non precise"}</small>
        </span>
        <span>${row.roleName}</span>
        <span>${row.compensationLabel}</span>
        <span>
          <strong>${row.amountLabel}</strong>
          <button class="mini-btn" type="button" data-edit-comp="${row.id}">Modifier</button>
        </span>
      </div>
    `).join("")}
  `;

  analyticsTable.querySelectorAll("[data-edit-comp]").forEach((button) => {
    button.addEventListener("click", () => {
      const row = staffCache.find((entry) => String(entry.id) === button.dataset.editComp);

      if (!row) {
        return;
      }

      compensationUser.value = row.id;
      compensationModel.value = row.compensationModel || "volunteer";
      compensationAmount.value = Number(row.amount || 0);
      compensationCurrency.value = row.currency || "USD";
      compensationNotes.value = row.notes || "";
      compensationFeedback.textContent = `Edition de la remuneration pour ${row.fullName}.`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

async function loadExecutiveAnalytics() {
  const response = await fetch("/api/analytics/executive");

  if (response.status === 403) {
    window.location.href = "/staff";
    return;
  }

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || "Impossible de charger la vue CEO");
  }

  renderSummary(payload.data.summary || {});
  renderAlerts(payload.data.alerts || []);
  renderTable(payload.data.staff || []);
}

compensationForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userId = compensationUser.value;

  if (!userId) {
    compensationFeedback.textContent = "Choisissez d'abord un membre.";
    return;
  }

  try {
    const response = await fetch(`/api/analytics/compensation/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compensationModel: compensationModel.value,
        amount: compensationAmount.value,
        currency: compensationCurrency.value,
        notes: compensationNotes.value
      })
    });

    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || "Impossible de mettre a jour la remuneration");
    }

    compensationFeedback.textContent = "Remuneration mise a jour avec succes.";
    await loadExecutiveAnalytics();
  } catch (error) {
    compensationFeedback.textContent = error.message;
  }
});

(async () => {
  const user = await ensureStaffSession();

  if (!user || user.roleName !== "admin") {
    window.location.href = "/staff";
    return;
  }

  await loadExecutiveAnalytics();
})();
