const contactForm = document.getElementById("quote-form");
const selectedPlanBanner = document.getElementById("selected-plan-banner");
const selectedPlanLabel = document.getElementById("selected-plan-label");

function hydratePlanFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan")?.trim();
  const projectType = params.get("projectType")?.trim();

  if (!contactForm) {
    return;
  }

  const projectTypeField = contactForm.querySelector('[name="project_type"]');
  const descriptionField = contactForm.querySelector('[name="description"]');

  if (plan && selectedPlanBanner && selectedPlanLabel) {
    selectedPlanLabel.textContent = plan;
    selectedPlanBanner.hidden = false;
  }

  if (projectTypeField && projectType) {
    projectTypeField.value = projectType;
  }

  if (descriptionField && plan && !descriptionField.value.trim()) {
    descriptionField.value = `Bonjour WebFy,\n\nJe souhaite avancer avec le plan ${plan}.\n\nVoici quelques details sur mon projet:`;
  }
}

if (contactForm) {
  hydratePlanFromUrl();

  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitButton = contactForm.querySelector(".btn-submit");
    const formData = new FormData(contactForm);
    const payload = {
      name: formData.get("name")?.trim(),
      email: formData.get("email")?.trim(),
      phone: formData.get("phone")?.trim(),
      projectType: formData.get("project_type")?.trim(),
      description: formData.get("description")?.trim()
    };

    submitButton.disabled = true;
    submitButton.textContent = "Envoi en cours...";

    try {
      const response = await fetch("/api/contact", {
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
          ? "Votre demande a bien ete envoyee. WebFy vous repondra sous 24 a 48 heures."
          : "Votre demande a bien ete enregistree. L'email automatique n'est pas encore configure."
      );
      contactForm.reset();
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
