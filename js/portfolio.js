const filterButtons = document.querySelectorAll("[data-filter]");
const cards = document.querySelectorAll(".project-card");
const projectGrid = document.querySelector(".project-grid");
const modal = document.getElementById("project-modal");
const closeBtn = document.querySelector(".close");

function syncPortfolioLayout() {
  if (!projectGrid) {
    return;
  }

  const visibleCards = Array.from(cards).filter((card) => card.style.display !== "none");
  const visibleCount = visibleCards.length;

  projectGrid.dataset.visibleCount = String(visibleCount);
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((button) => button.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;
    cards.forEach((card) => {
      const isVisible = filter === "all" || card.dataset.type === filter;
      card.style.display = isVisible ? "block" : "none";
    });

    syncPortfolioLayout();
  });
});

syncPortfolioLayout();

document.querySelectorAll(".btn-view").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("modal-title").textContent = btn.dataset.title;
    document.getElementById("modal-desc").textContent = btn.dataset.desc;
    document.getElementById("modal-tech").textContent = btn.dataset.tech;
    document.getElementById("modal-year").textContent = btn.dataset.year;
    document.getElementById("modal-result").textContent = btn.dataset.result || "Une meilleure lisibilite, une meilleure image et un parcours plus solide.";

    if (modal) {
      modal.style.display = "flex";
    }
  });
});

if (closeBtn && modal) {
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      modal.style.display = "none";
    }
  });
}
