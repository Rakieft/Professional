const menuButton = document.getElementById("menu-button");
const sidebar = document.getElementById("sidebar");
const logoutButton = document.getElementById("logout-button");

if (menuButton && sidebar) {
  menuButton.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  sidebar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      sidebar.classList.remove("open");
    });
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  });
}

async function ensureStaffSession() {
  const response = await fetch("/api/auth/session");
  const payload = await response.json();

  if (!payload.authenticated) {
    window.location.href = "/login";
    throw new Error("Unauthenticated");
  }

  return payload.user;
}
