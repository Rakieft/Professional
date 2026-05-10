const quoteForm = document.getElementById("quote-form");
const paymentForm = document.getElementById("payment-form");
const quoteFeedback = document.getElementById("quote-feedback");
const paymentFeedback = document.getElementById("payment-feedback");
const quoteList = document.getElementById("quote-list");
const invoiceList = document.getElementById("invoice-list");
const paymentList = document.getElementById("payment-list");
const quoteClient = document.getElementById("quote-client");
const paymentClient = document.getElementById("payment-client");
const paymentProject = document.getElementById("payment-project");
const paymentInvoice = document.getElementById("payment-invoice");
const financeTotalQuoted = document.getElementById("finance-total-quoted");
const financeAccepted = document.getElementById("finance-accepted");
const financeReceived = document.getElementById("finance-received");
const financePending = document.getElementById("finance-pending");

let financeUser = null;

function canManageFinance() {
  const roleName = financeUser?.roleName || "";
  return ["admin", "operations_manager", "project_manager", "sales_manager"].includes(roleName);
}

function fillSelect(select, rows, labelKey = "name") {
  select.innerHTML = '<option value="">Choisir</option>' +
    rows.map((row) => `<option value="${row.id}">${row[labelKey]}</option>`).join("");
}

function fillInvoiceSelect(rows) {
  paymentInvoice.innerHTML = '<option value="">Choisir</option>' +
    rows.map((row) => `<option value="${row.id}">${row.invoiceNumber} - ${row.clientName || "Sans client"}</option>`).join("");
}

function formatMoney(amount, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function renderSummary(summary) {
  financeTotalQuoted.textContent = summary.totalQuotedLabel || "$0";
  financeAccepted.textContent = summary.acceptedQuotedLabel || "$0";
  financeReceived.textContent = summary.revenueReceivedLabel || "$0";
  const pendingTotal = Number(summary.pendingQuoted || 0) + Number(summary.revenuePending || 0);
  financePending.textContent = formatMoney(pendingTotal);
}

function renderQuotes(quotes) {
  quoteList.innerHTML = quotes.length
    ? quotes.map((quote) => `
      <article class="stack-card">
        <div class="stack-head">
          <strong>${quote.clientName || "Client non rattache"}</strong>
          <span class="status-chip">${quote.status}</span>
        </div>
        <p>${quote.projectType}</p>
        <small>${formatMoney(quote.amount)} | ${quote.createdAt || "Date inconnue"}</small>
        <div class="stack-actions">
          <button class="mini-btn" type="button" data-generate-invoice="${quote.id}">Generer facture</button>
        </div>
      </article>
    `).join("")
    : `<article class="stack-card"><p>Aucun devis enregistre pour le moment.</p></article>`;

  quoteList.querySelectorAll("[data-generate-invoice]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const response = await fetch(`/api/finance/quotes/${button.dataset.generateInvoice}/invoice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Impossible de generer la facture");
        }

        quoteFeedback.textContent = `Facture ${result.data.invoiceNumber} creee avec succes.`;
        await loadFinance();
      } catch (error) {
        quoteFeedback.textContent = error.message;
      }
    });
  });
}

function renderInvoices(invoices) {
  invoiceList.innerHTML = invoices.length
    ? invoices.map((invoice) => `
      <article class="stack-card">
        <div class="stack-head">
          <strong>${invoice.invoiceNumber}</strong>
          <span class="status-chip">${invoice.status}</span>
        </div>
        <p>${invoice.title}</p>
        <small>${invoice.clientName || "Sans client"} | ${formatMoney(invoice.amount, invoice.currency || "USD")} | Echeance: ${invoice.dueDate || "-"}</small>
      </article>
    `).join("")
    : `<article class="stack-card"><p>Aucune facture generee pour le moment.</p></article>`;
}

function renderPayments(payments) {
  paymentList.innerHTML = payments.length
    ? payments.map((payment) => `
      <article class="stack-card">
        <div class="stack-head">
          <strong>${payment.title}</strong>
          <span class="status-chip">${payment.paymentStatus}</span>
        </div>
        <p>${payment.clientName || "Sans client"}${payment.projectName ? ` | ${payment.projectName}` : ""}</p>
        <small>${formatMoney(payment.amount, payment.currency || "USD")} | ${payment.paymentMethod || "Methode non precisee"} | ${payment.paymentDate || "Sans date"}</small>
      </article>
    `).join("")
    : `<article class="stack-card"><p>Aucun paiement enregistre pour le moment.</p></article>`;
}

async function loadFinance() {
  const response = await fetch("/api/finance");
  const payload = await response.json();

  renderSummary(payload.data.summary || {});
  renderQuotes(payload.data.quotes || []);
  renderInvoices(payload.data.invoices || []);
  renderPayments(payload.data.payments || []);
  fillSelect(quoteClient, payload.data.clients || []);
  fillSelect(paymentClient, payload.data.clients || []);
  fillSelect(paymentProject, payload.data.projects || []);
  fillInvoiceSelect(payload.data.invoices || []);
}

function lockForm(form, messageNode, text) {
  Array.from(form.elements).forEach((field) => {
    field.disabled = true;
  });
  messageNode.textContent = text;
}

if (quoteForm) {
  quoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(quoteForm).entries());

    try {
      const response = await fetch("/api/finance/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Impossible de creer le devis");
      }

      quoteForm.reset();
      quoteFeedback.textContent = "Devis cree avec succes.";
      await loadFinance();
    } catch (error) {
      quoteFeedback.textContent = error.message;
    }
  });
}

if (paymentForm) {
  paymentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(paymentForm).entries());

    try {
      const response = await fetch("/api/finance/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Impossible d'enregistrer le paiement");
      }

      paymentForm.reset();
      document.getElementById("payment-currency").value = "USD";
      paymentFeedback.textContent = "Paiement enregistre avec succes.";
      await loadFinance();
    } catch (error) {
      paymentFeedback.textContent = error.message;
    }
  });
}

(async () => {
  financeUser = await ensureStaffSession();

  if (!canManageFinance()) {
    lockForm(
      quoteForm,
      quoteFeedback,
      "Vous pouvez consulter la finance, mais la creation de devis est reservee aux roles business et management."
    );
    lockForm(
      paymentForm,
      paymentFeedback,
      "Vous pouvez consulter les paiements, mais l'enregistrement est reserve aux roles business et management."
    );
  }

  await loadFinance();
})();
