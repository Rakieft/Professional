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
