const nodemailer = require("nodemailer");

function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendContactEmail(contact) {
  if (!isMailConfigured()) {
    return {
      sent: false,
      reason: "missing_smtp_config"
    };
  }

  const transporter = createTransporter();
  const recipient = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || "WebFy Contact";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const replyTo = contact.email || fromEmail;

  const subject = `Nouveau lead WebFy - ${contact.projectType || "Demande de contact"}`;
  const text = [
    "Nouvelle demande de contact WebFy",
    "",
    `Nom: ${contact.name}`,
    `Email: ${contact.email}`,
    `Telephone: ${contact.phone || "Non renseigne"}`,
    `Type de projet: ${contact.projectType}`,
    "",
    "Description:",
    contact.description
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0b1724;">
      <h2 style="margin-bottom: 12px;">Nouvelle demande de contact WebFy</h2>
      <p><strong>Nom:</strong> ${contact.name}</p>
      <p><strong>Email:</strong> ${contact.email}</p>
      <p><strong>Telephone:</strong> ${contact.phone || "Non renseigne"}</p>
      <p><strong>Type de projet:</strong> ${contact.projectType}</p>
      <p><strong>Description:</strong></p>
      <div style="padding: 14px; border-radius: 12px; background: #f4f7fb; white-space: pre-wrap;">${contact.description}</div>
    </div>
  `;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: recipient,
    replyTo,
    subject,
    text,
    html
  });

  return {
    sent: true
  };
}

module.exports = {
  isMailConfigured,
  sendContactEmail
};
