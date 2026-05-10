const leadForm = document.getElementById("lead-form");
const leadFeedback = document.getElementById("lead-feedback");
const leadListPage = document.getElementById("lead-list-page");
let currentUser = null;

const leadStatusLabels = {
  new: "Nouveau",
  contacted: "Contacte",
  qualified: "Qualifie",
  won: "Gagne",
  lost: "Perdu"
};

function canManageLeads() {
  const roleName = currentUser?.roleName || "";
  return ["admin", "operations_manager", "project_manager", "sales_manager"].includes(roleName);
}

function renderLeads(leads) {
  if (!leadListPage) {
    return;
  }

  if (!leads.length) {
    leadListPage.innerHTML = `
      <article class="stack-card">
        <div class="stack-head">
          <strong>Aucun lead pour le moment</strong>
          <span class="status-chip">pipeline</span>
        </div>
        <p>Les nouvelles demandes staff ou site public apparaitront ici.</p>
      </article>
    `;
    return;
  }

  leadListPage.innerHTML = leads
    .map(
      (lead) => `
        <article class="stack-card">
          <div class="stack-head">
            <strong>${lead.companyName}</strong>
            <span class="status-chip">${leadStatusLabels[lead.status] || lead.status}</span>
          </div>
          <p>${lead.needSummary}</p>
          <small>${lead.contactName || "Sans contact"} | ${lead.email || "Sans email"} | ${lead.phone || "Sans telephone"}</small>
          <div class="stack-actions">
            <button class="mini-btn success" data-convert-lead="${lead.id}" type="button" ${(lead.status === "won" || !canManageLeads()) ? "disabled" : ""}>
              ${lead.status === "won" ? "Deja converti" : "Convertir en client"}
            </button>
            <button class="mini-btn" data-convert-project="${lead.id}" type="button" ${(lead.status === "won" || !canManageLeads()) ? "disabled" : ""}>
              ${lead.status === "won" ? "Projet deja traite" : "Client + projet"}
            </button>
          </div>
        </article>
      `
    )
    .join("");

  leadListPage.querySelectorAll("[data-convert-lead]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const response = await fetch(`/api/leads/${button.dataset.convertLead}/convert`, {
          method: "POST"
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Impossible de convertir ce lead");
        }

        leadFeedback.textContent = result.message;
        await loadLeads();
      } catch (error) {
        leadFeedback.textContent = error.message;
      }
    });
  });

  leadListPage.querySelectorAll("[data-convert-project]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const response = await fetch(`/api/leads/${button.dataset.convertProject}/convert-project`, {
          method: "POST"
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Impossible de convertir ce lead en projet");
        }

        leadFeedback.textContent = result.message;
        await loadLeads();
      } catch (error) {
        leadFeedback.textContent = error.message;
      }
    });
  });
}

async function loadLeads() {
  const response = await fetch("/api/leads");
  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || "Unable to load leads");
  }

  renderLeads(payload.data || []);
}

if (leadForm) {
  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(leadForm).entries());

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to create lead");
      }

      leadForm.reset();
      leadFeedback.textContent = "Lead cree avec succes.";
      await loadLeads();
    } catch (error) {
      leadFeedback.textContent = error.message;
    }
  });
}

(async () => {
  currentUser = await ensureStaffSession();

  if (!canManageLeads() && leadForm) {
    Array.from(leadForm.elements).forEach((field) => {
      if (field.tagName === "BUTTON") {
        field.disabled = true;
        field.textContent = "Gestion reservee aux roles commerciaux";
      } else {
        field.disabled = true;
      }
    });

    leadFeedback.textContent = "Vous pouvez consulter les leads, mais la creation et la conversion sont reservees aux roles commerciaux et management.";
  }

  await loadLeads();
})();
