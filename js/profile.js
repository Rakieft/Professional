const profileForm = document.getElementById("profile-form");
const profileFeedback = document.getElementById("profile-feedback");
const profileName = document.getElementById("profile-name");
const profileRole = document.getElementById("profile-role");
const profileJob = document.getElementById("profile-job");
const profileEmail = document.getElementById("profile-email");
const profileTotalTasks = document.getElementById("profile-total-tasks");
const profileOpenTasks = document.getElementById("profile-open-tasks");
const profileCompletedTasks = document.getElementById("profile-completed-tasks");

function fillProfile(profile) {
  profileName.textContent = profile.fullName || "Staff";
  profileRole.textContent = (profile.roleName || "staff").replaceAll("_", " ");
  profileJob.textContent = profile.jobTitle || "Poste non precise";
  profileEmail.textContent = profile.email || "Email indisponible";
  profileTotalTasks.textContent = `${profile.stats?.totalTasks || 0} taches`;
  profileOpenTasks.textContent = `${profile.stats?.openTasks || 0} taches ouvertes`;
  profileCompletedTasks.textContent = `${profile.stats?.completedTasks || 0} livraisons`;

  document.getElementById("profile-full-name").value = profile.fullName || "";
  document.getElementById("profile-job-title").value = profile.jobTitle || "";
  document.getElementById("profile-phone").value = profile.phone || "";
  document.getElementById("profile-whatsapp-phone").value = profile.whatsappPhone || "";
  document.getElementById("profile-bio").value = profile.bio || "";
}

async function loadProfile() {
  const response = await fetch("/api/users/me");
  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || "Impossible de charger le profil");
  }

  fillProfile(payload.data);
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(profileForm).entries());

  if (!payload.password) {
    delete payload.password;
  }

  try {
    const response = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Impossible de mettre le profil a jour");
    }

    profileFeedback.textContent = "Profil mis a jour avec succes.";
    await ensureStaffSession();
    await loadProfile();
    document.getElementById("profile-password").value = "";
  } catch (error) {
    profileFeedback.textContent = error.message;
  }
});

(async () => {
  await ensureStaffSession();
  await loadProfile();
})();
