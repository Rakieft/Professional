const clientForm = document.getElementById("client-form");
const clientFeedback = document.getElementById("client-feedback");
const clientList = document.getElementById("client-list");

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
  await ensureStaffSession();
  await loadClients();
})();
