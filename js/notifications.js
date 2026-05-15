const notificationsUnread = document.getElementById("notifications-unread");
const notificationsActivityCount = document.getElementById("notifications-activity-count");
const notificationsCategories = document.getElementById("notifications-categories");
const notificationsFilterCategory = document.getElementById("notifications-filter-category");
const notificationsList = document.getElementById("notifications-list");
const notificationsActivityList = document.getElementById("notifications-activity-list");

function renderNotifications(data) {
  notificationsUnread.textContent = `${data.unread || 0} alerte(s)`;
  notificationsActivityCount.textContent = `${(data.activity || []).length} evenement(s)`;
  const categorySummary = data.categories || {};

  notificationsCategories.innerHTML = Object.keys(categorySummary).length
    ? `
      <article class="stack-card">
        <div class="stack-head">
          <strong>Repartition par categorie</strong>
          <span class="status-chip">role-aware</span>
        </div>
        <p>${Object.entries(categorySummary).map(([key, value]) => `${key}: ${value}`).join(" | ")}</p>
      </article>
    `
    : "";

  notificationsList.innerHTML = (data.notifications || []).length
    ? data.notifications.map((notification) => `
      <article class="stack-card ${Number(notification.isRead) === 1 ? "" : "is-selected"}">
        <div class="stack-head">
          <strong>${notification.title}</strong>
          <span class="status-chip">${notification.category}</span>
        </div>
        <p>${notification.message}</p>
        <small>${notification.targetName} | ${notification.createdAt}</small>
        <div class="stack-actions">
          ${notification.linkUrl ? `<a class="mini-btn" href="${notification.linkUrl}">Ouvrir</a>` : ""}
          ${Number(notification.isRead) !== 1 ? `<button class="mini-btn success" type="button" data-read-id="${notification.id}">Marquer comme lue</button>` : ""}
        </div>
      </article>
    `).join("")
    : `<article class="stack-card"><p>Aucune notification pour le moment.</p></article>`;

  notificationsList.querySelectorAll("[data-read-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      await fetch(`/api/notifications/${button.dataset.readId}/read`, { method: "PATCH" });
      await loadNotifications();
    });
  });

  notificationsActivityList.innerHTML = (data.activity || []).length
    ? data.activity.map((item) => `
      <article class="stack-card">
        <div class="stack-head">
          <strong>${item.projectName}</strong>
          <span class="status-chip">activite</span>
        </div>
        <p>${item.message}</p>
        <small>${item.happenedAt}</small>
      </article>
    `).join("")
    : `<article class="stack-card"><p>Aucune activite recente pour le moment.</p></article>`;
}

async function loadNotifications() {
  const category = notificationsFilterCategory?.value || "";
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const response = await fetch(`/api/notifications${query}`);
  const payload = await response.json();
  renderNotifications(payload.data || { unread: 0, notifications: [] });
}

if (notificationsFilterCategory) {
  notificationsFilterCategory.addEventListener("change", loadNotifications);
}

(async () => {
  await ensureStaffSession();
  await loadNotifications();
})();
