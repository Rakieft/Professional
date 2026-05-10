const clientForm = document.getElementById("client-form");
const clientFeedback = document.getElementById("client-feedback");
const clientList = document.getElementById("client-list");
let currentUser = null;

function canManageClients() {
  const roleName = currentUser?.roleName || "";
  return ["admin", "operations_manager", "project_manager", "sales_manager", "support_manager"].includes(roleName);
}

function renderClients(clients) {
  clientList.innerHTML = clients
    .map(
      (client) => `
        <article class="stack-card">
          <div class="stack-head">
            <strong>${client.name}</strong>
            <span class="status-chip">${client.status}</span>
          </div>
          <p>${client.companyType || "Type non precise"}</p>
          <small>${client.contactName || "Sans contact"} · ${client.email || "Sans email"} · ${client.phone || "Sans telephone"}</small>
        </article>
      `
    )
    .join("");
}

async function loadClients() {
  const response = await fetch("/api/clients");
  const payload = await response.json();
  renderClients(payload.data || []);
}

if (clientForm) {
  clientForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(clientForm).entries());

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to create client");
      }

      clientForm.reset();
      clientFeedback.textContent = "Client cree avec succes.";
      await loadClients();
    } catch (error) {
      clientFeedback.textContent = error.message;
    }
  });
}

(async () => {
  currentUser = await ensureStaffSession();

  if (!canManageClients() && clientForm) {
    Array.from(clientForm.elements).forEach((field) => {
      if (field.tagName === "BUTTON") {
        field.disabled = true;
        field.textContent = "Gestion reservee aux roles business";
      } else {
        field.disabled = true;
      }
    });

    clientFeedback.textContent = "Vous pouvez consulter les clients, mais la creation est reservee aux roles business et management.";
  }

  await loadClients();
})();
