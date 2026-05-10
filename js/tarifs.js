const quoteForm = document.getElementById("quote-form");

if (quoteForm) {
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
    } catch (error) {
      alert(error.message || "Erreur lors de l'envoi. Veuillez reessayer.");
      console.error(error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Envoyer la demande";
    }
  });
}
