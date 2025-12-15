/* =========================
   MENU TOGGLE (MOBILE)
========================= */
const menuToggle = document.getElementById("menu-toggle");
const navMenu = document.getElementById("nav-menu");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });
}

/* =========================
   HERO SLIDER AUTOMATIQUE
========================= */
const slides = document.querySelectorAll(".hero-slide");
let currentSlide = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.remove("active");
    if (i === index) {
      slide.classList.add("active");
    }
  });
}

function nextSlide() {
  currentSlide++;
  if (currentSlide >= slides.length) {
    currentSlide = 0;
  }
  showSlide(currentSlide);
}

// Lancer le slider uniquement si des slides existent
if (slides.length > 0) {
  showSlide(currentSlide);
  setInterval(nextSlide, 5000); // change toutes les 5 secondes
}
