// MENU TOGGLE
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
