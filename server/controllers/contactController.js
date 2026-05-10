const db = require("../config/db");
const { sendContactEmail } = require("../services/mailerService");

async function savePublicLead({
  name,
  email,
  phone,
  projectType,
  description,
  source,
  notesSuffix = ""
}) {
  const companyName = name.trim();
  const contactName = name.trim();
  const cleanEmail = email.trim();
  const cleanPhone = phone?.trim() || null;
  const cleanProjectType = projectType.trim();
  const cleanDescription = description.trim();
  const cleanNotes = `${cleanDescription}${notesSuffix}`.trim();

  const leadResult = await db.query(
    `INSERT INTO leads
      (company_name, contact_name, email, phone, need_summary, project_type, status, source, notes)
     VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
    [
      companyName,
      contactName,
      cleanEmail,
      cleanPhone,
      cleanDescription.slice(0, 255),
      cleanProjectType,
      source,
      cleanNotes
    ]
  );

  return {
    leadId: leadResult.insertId,
    contact: {
      name: contactName,
      email: cleanEmail,
      phone: cleanPhone,
      projectType: cleanProjectType,
      description: cleanNotes
    }
  };
}

async function submitContactRequest(req, res, next) {
  try {
    const {
      name,
      email,
      phone,
      projectType,
      description
    } = req.body;

    if (!name || !email || !projectType || !description) {
      return res.status(400).json({
        ok: false,
        message: "Veuillez remplir tous les champs obligatoires."
      });
    }

    const { leadId, contact } = await savePublicLead({
      name,
      email,
      phone,
      projectType,
      description,
      source: "Website contact form"
    });

    const mailResult = await sendContactEmail(contact);

    res.status(201).json({
      ok: true,
      emailSent: mailResult.sent,
      message: mailResult.sent
        ? "Votre demande a ete envoyee avec succes."
        : "Votre demande a bien ete enregistree. L'envoi email n'est pas encore configure.",
      data: {
        leadId
      }
    });
  } catch (error) {
    next(error);
  }
}

async function submitQuoteRequest(req, res, next) {
  try {
    const {
      name,
      email,
      phone,
      website,
      projectType,
      description
    } = req.body;

    if (!name || !email || !projectType || !description) {
      return res.status(400).json({
        ok: false,
        message: "Veuillez remplir tous les champs obligatoires."
      });
    }

    const notesSuffix = website?.trim()
      ? `\n\nSite existant: ${website.trim()}`
      : "";

    const { leadId, contact } = await savePublicLead({
      name,
      email,
      phone,
      projectType,
      description,
      source: "Website pricing form",
      notesSuffix
    });

    const mailResult = await sendContactEmail({
      ...contact,
      description: `${contact.description}${notesSuffix}`.trim()
    });

    res.status(201).json({
      ok: true,
      emailSent: mailResult.sent,
      message: mailResult.sent
        ? "Votre demande de devis a ete envoyee avec succes."
        : "Votre demande de devis a bien ete enregistree. L'envoi email n'est pas encore configure.",
      data: {
        leadId
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitContactRequest,
  submitQuoteRequest
};
