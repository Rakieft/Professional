const loginForm = document.getElementById("login-form");
const loginFeedback = document.getElementById("login-feedback");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const payload = Object.fromEntries(formData.entries());

    if (loginFeedback) {
      loginFeedback.textContent = "Connexion en cours...";
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Login failed");
      }

      if (loginFeedback) {
        loginFeedback.textContent = "Connexion reussie. Redirection...";
      }

      window.location.href = "/staff";
    } catch (error) {
      if (loginFeedback) {
        loginFeedback.textContent = error.message || "Erreur de connexion.";
      }
    }
  });
}
