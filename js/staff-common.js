const menuButton = document.getElementById("menu-button");
const sidebar = document.getElementById("sidebar");
const logoutButton = document.getElementById("logout-button");
const roleChip = document.getElementById("role-chip");
const sessionUserLabel = document.getElementById("session-user-label");
let currentStaffUser = null;

const pageRoleVisibility = {
  "/team": ["admin", "cofounder", "secretary", "operations_manager"],
  "/finance": ["admin", "cofounder", "secretary", "operations_manager", "project_manager", "sales_manager"],
  "/analytics": ["admin"]
};

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

  const roleName = payload.user?.roleName || "staff";
  const fullName = payload.user?.fullName || "Session staff";

  if (roleChip) {
    roleChip.textContent = roleName.replaceAll("_", " ");
  }

  if (sessionUserLabel) {
    sessionUserLabel.textContent = `${fullName} | ${roleName.replaceAll("_", " ")}`;
  }

  document.body.dataset.role = roleName;
  const adminOnlyLinks = document.querySelectorAll("[data-admin-only]");
  const navLinks = document.querySelectorAll(".side-nav a[href]");

  adminOnlyLinks.forEach((link) => {
    if (roleName === "admin") {
      link.hidden = false;
    } else {
      link.hidden = true;
    }
  });

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    const allowedRoles = pageRoleVisibility[href];

    if (!allowedRoles) {
      link.hidden = false;
      return;
    }

    link.hidden = !allowedRoles.includes(roleName);
  });

  currentStaffUser = payload.user;

  return payload.user;
}

function getCurrentStaffUser() {
  return currentStaffUser;
}
