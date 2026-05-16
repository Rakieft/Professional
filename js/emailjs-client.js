const EMAILJS_PUBLIC_KEY = "wQjj0BIdgLpPpoP9N";
const EMAILJS_SERVICE_ID = "service_6z5r8gh";
const EMAILJS_TEMPLATE_CONTACT = "template_1jxbjuh";
const EMAILJS_TEMPLATE_QUOTE = "template_ielb8b8";

let emailJsReady = false;

function ensureEmailJs() {
  if (!window.emailjs) {
    throw new Error("EmailJS n'est pas charge.");
  }

  if (!emailJsReady) {
    window.emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY
    });
    emailJsReady = true;
  }
}

async function sendContactEmailJs(payload) {
  ensureEmailJs();

  return window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CONTACT, {
    name: payload.name,
    email: payload.email,
    phone: payload.phone || "Non renseigne",
    project_type: payload.projectType,
    message: payload.description
  });
}

async function sendQuoteEmailJs(payload) {
  ensureEmailJs();

  return window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_QUOTE, {
    name: payload.name,
    email: payload.email,
    phone: payload.phone || "Non renseigne",
    website: payload.website || "Aucun site existant",
    project_type: payload.projectType,
    selected_plan: payload.selectedPlan || "Sur mesure",
    message: payload.description
  });
}
