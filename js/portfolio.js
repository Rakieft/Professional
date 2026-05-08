const filterButtons = document.querySelectorAll("[data-filter]");
const cards = document.querySelectorAll(".project-card");
const modal = document.getElementById("project-modal");
const closeBtn = document.querySelector(".close");

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((button) => button.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;
    cards.forEach((card) => {
      const isVisible = filter === "all" || card.dataset.type === filter;
      card.style.display = isVisible ? "block" : "none";
    });
  });
});

document.querySelectorAll(".btn-view").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("modal-title").textContent = btn.dataset.title;
    document.getElementById("modal-desc").textContent = btn.dataset.desc;
    document.getElementById("modal-tech").textContent = btn.dataset.tech;
    document.getElementById("modal-year").textContent = btn.dataset.year;

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
}
