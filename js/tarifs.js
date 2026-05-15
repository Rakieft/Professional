const quoteForm = document.getElementById("quote-form");
const selectedPlanBanner = document.getElementById("selected-plan-banner");
const selectedPlanLabel = document.getElementById("selected-plan-label");
const planTriggers = document.querySelectorAll("[data-select-plan]");

function applySelectedPlan(plan, projectType) {
  if (!quoteForm || !plan) {
    return;
  }

  const projectTypeField = quoteForm.querySelector('[name="project_type"]');
  const descriptionField = quoteForm.querySelector('[name="description"]');

  if (selectedPlanBanner && selectedPlanLabel) {
    selectedPlanLabel.textContent = plan;
    selectedPlanBanner.hidden = false;
  }

  if (projectTypeField && projectType) {
    projectTypeField.value = projectType;
  }

  if (descriptionField && !descriptionField.value.trim()) {
    descriptionField.value = `Bonjour WebFy,\n\nJe souhaite recevoir une proposition pour le plan ${plan}.\n\nVoici quelques details sur mon projet:`;
  }
}

function hydratePlanFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan")?.trim();
  const projectType = params.get("projectType")?.trim();

  if (plan) {
    applySelectedPlan(plan, projectType);
  }
}

planTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();

    const plan = trigger.dataset.selectPlan?.trim();
    const projectType = trigger.dataset.projectType?.trim();

    applySelectedPlan(plan, projectType);

    const quoteSection = document.getElementById("quote-section");
    if (quoteSection) {
      quoteSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

if (quoteForm) {
  hydratePlanFromUrl();

  quoteForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitButton = quoteForm.querySelector(".btn-submit");
    const formData = new FormData(quoteForm);
    const payload = {
      name: formData.get("name")?.trim(),
      email: formData.get("email")?.trim(),
      phone: formData.get("phone")?.trim(),
      website: formData.get("website")?.trim(),
      projectType: formData.get("project_type")?.trim(),
      description: formData.get("description")?.trim()
    };

    submitButton.disabled = true;
    submitButton.textContent = "Envoi en cours...";

    try {
      const response = await fetch("/api/contact/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Erreur lors de l'envoi.");
      }

      alert(
        result.emailSent
          ? "Votre demande de devis a bien ete envoyee. WebFy vous repondra sous 24 a 48 heures."
          : "Votre demande de devis a bien ete enregistree. L'email automatique n'est pas encore configure."
      );
      quoteForm.reset();
      if (selectedPlanBanner) {
        selectedPlanBanner.hidden = true;
      }
    } catch (error) {
      alert(error.message || "Erreur lors de l'envoi. Veuillez reessayer.");
      console.error(error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Envoyer la demande";
    }
  });
}
