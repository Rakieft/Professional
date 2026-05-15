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
const analyticsNetCashFlow = document.getElementById("analytics-net-cash-flow");
const analyticsGrossMargin = document.getElementById("analytics-gross-margin");
const analyticsProfitability = document.getElementById("analytics-profitability");
const analyticsFixedCostBase = document.getElementById("analytics-fixed-cost-base");
const analyticsAverageSalary = document.getElementById("analytics-average-salary");
const analyticsTable = document.getElementById("analytics-table");
const analyticsAlerts = document.getElementById("analytics-alerts");
const analyticsBusinessSnapshot = document.getElementById("analytics-business-snapshot");
const analyticsRunwayBadge = document.getElementById("analytics-runway-badge");
const analyticsFocusGrid = document.getElementById("analytics-focus-grid");
const analyticsTractionPanel = document.getElementById("analytics-traction-panel");
const analyticsTeamHealth = document.getElementById("analytics-team-health");
const analyticsDecisionCards = document.getElementById("analytics-decision-cards");

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
  analyticsNetCashFlow.textContent = summary.netCashFlowLabel || "$0";
  analyticsGrossMargin.textContent = summary.grossMarginLabel || "$0";
  analyticsProfitability.textContent = summary.profitabilityRateLabel || "0%";
  analyticsFixedCostBase.textContent = summary.fixedCostBaseLabel || "$0";
  analyticsAverageSalary.textContent = `Salaire moyen: ${money(summary.averageSalary || 0)}`;
  analyticsRunwayBadge.textContent = `Runway: ${summary.runwayLabel || "analyse"}`;

  analyticsBusinessSnapshot.innerHTML = `
    <article class="stack-card">
      <div class="stack-head">
        <strong>${summary.activeProjects || 0} projets actifs</strong>
        <span class="status-chip">delivery</span>
      </div>
      <p>${summary.openTasks || 0} tache(s) ouvertes, dont ${summary.overdueTasks || 0} en retard. Taux de livraison: ${summary.deliveryRateLabel || "0%"}.</p>
    </article>
    <article class="stack-card">
      <div class="stack-head">
        <strong>${summary.pipelineLeads || 0} leads dans le pipeline</strong>
        <span class="status-chip">sales</span>
      </div>
      <p>${summary.wonLeads || 0} lead(s) gagnes, ${summary.openQuotesLabel || "$0"} en devis ouverts et ${summary.leadWinRateLabel || "0%"} de conversion exploitable.</p>
    </article>
    <article class="stack-card">
      <div class="stack-head">
        <strong>${summary.receivedRevenueLabel || "$0"} encaisses</strong>
        <span class="status-chip">cash</span>
      </div>
      <p>${summary.pendingRevenueLabel || "$0"} en paiements a suivre, ${summary.thisMonthRevenueLabel || "$0"} recu ce mois-ci et ${summary.acceptedRevenueLabel || "$0"} deja signe.</p>
    </article>
    <article class="stack-card">
      <div class="stack-head">
        <strong>${summary.paidStaffCount || 0} poste(s) remunere(s)</strong>
        <span class="status-chip">team</span>
      </div>
      <p>${summary.activeStaffCount || 0} compte(s) actif(s), ${summary.volunteerRatioLabel || "0%"} encore en benevolat.</p>
    </article>
  `;

  analyticsTractionPanel.innerHTML = `
    <article class="stack-card">
      <div class="stack-head">
        <strong>${summary.thisMonthRevenueLabel || "$0"} captes ce mois-ci</strong>
        <span class="status-chip">cash</span>
      </div>
      <p>Couverture actuelle des couts: ${summary.costCoverageRateLabel || "0%"}. Niveau de tresorerie: ${summary.runwayLabel || "analyse"}.</p>
    </article>
    <article class="stack-card">
      <div class="stack-head">
        <strong>${summary.quoteCoverageRateLabel || "0%"} de couverture devis</strong>
        <span class="status-chip">sales</span>
      </div>
      <p>${summary.acceptedRevenueLabel || "$0"} signes face a ${summary.openQuotesLabel || "$0"} encore a transformer.</p>
    </article>
  `;

  analyticsTeamHealth.innerHTML = `
    <article class="stack-card">
      <div class="stack-head">
        <strong>${summary.volunteerRatioLabel || "0%"} de benevolat</strong>
        <span class="status-chip">team</span>
      </div>
      <p>${summary.volunteerCount || 0} membre(s) benevoles pour ${summary.totalStaff || 0} profil(s) au total.</p>
    </article>
    <article class="stack-card">
      <div class="stack-head">
        <strong>${summary.paidRatioLabel || "0%"} de postes remuneres</strong>
        <span class="status-chip">ops</span>
      </div>
      <p>${summary.paidStaffCount || 0} poste(s) payes, ${summary.activeStaffCount || 0} compte(s) actifs dans l'espace staff.</p>
    </article>
    <article class="stack-card">
      <div class="stack-head">
        <strong>${summary.overduePressureRateLabel || "0%"} de pression delivery</strong>
        <span class="status-chip">delivery</span>
      </div>
      <p>${summary.completedTasks || 0} tache(s) completees sur ${summary.totalTasks || 0}, avec ${summary.overdueTasks || 0} en retard.</p>
    </article>
  `;
}

function renderFocus(summary, focusCards = []) {
  analyticsFocusGrid.innerHTML = focusCards.map((card) => `
    <article class="activity-item analytics-focus-card">
      <small>${card.title}</small>
      <strong>${card.value}</strong>
      <p>${card.caption}</p>
    </article>
  `).join("");
}

function renderDecisionCards(cards = []) {
  analyticsDecisionCards.innerHTML = cards.map((card) => `
    <article class="stack-card">
      <div class="stack-head">
        <strong>${card.title}</strong>
        <span class="status-chip">${card.label}</span>
      </div>
      <p>${card.text}</p>
    </article>
  `).join("");
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
  renderFocus(payload.data.summary || {}, payload.data.ceoFocus || []);
  renderAlerts(payload.data.alerts || []);
  renderDecisionCards(payload.data.decisionCards || []);
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
