/* =========================
MENU TOGGLE (MOBILE)
========================= */
const toggle = document.getElementById("menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");

toggle.addEventListener("click", () => {
  toggle.classList.toggle("active");
  mobileMenu.classList.toggle("active");
});

// SHRINK HEADER ON SCROLL
const header = document.getElementById("site-header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 80) {
    header.classList.add("shrink");
  } else {
    header.classList.remove("shrink");
  }
});

// FILTER
const filterButtons = document.querySelectorAll("[data-filter]");
const cards = document.querySelectorAll(".portfolio-card");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;
    cards.forEach(card => {
      card.style.display =
        filter === "all" || card.dataset.type === filter
          ? "block"
          : "none";
    });
  });
});

// MODAL
const modal = document.getElementById("project-modal");
const closeBtn = document.querySelector(".close");

document.querySelectorAll(".btn-view").forEach(btn => {
  btn.addEventListener("click", () => {
    document.getElementById("modal-title").textContent = btn.dataset.title;
    document.getElementById("modal-desc").textContent = btn.dataset.desc;
    document.getElementById("modal-tech").textContent = btn.dataset.tech;
    document.getElementById("modal-year").textContent = btn.dataset.year;
    modal.style.display = "flex";
  });
});

closeBtn.onclick = () => modal.style.display = "none";
window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};
