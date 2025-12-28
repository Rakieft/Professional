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

(function () {
  emailjs.init("L8Yy0tPxqoqJBretn");
})();

document.getElementById("quote-form").addEventListener("submit", function(e) {
  e.preventDefault();

  emailjs.sendForm(
    "service_yrvcvgh",
    "template_nbck2ng",
    this
  ).then(() => {
    alert("Votre demande a été envoyée avec succès !");
    this.reset();
  }, (error) => {
    alert("Erreur lors de l'envoi. Veuillez réessayer.");
    console.error(error);
  });
});
