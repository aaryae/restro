const generalConstant = require("../../constants/general-constant");
const { contactModel } = require("../../models");
const { sendMail, sendPlatformMail } = require("../../utils/mailer");
const paginate = require("../../utils/paginate");

const SERVE_INBOX =
  process.env.SERVE_CONTACT_TO || "serve@technirvana.com.np";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function notifyServeInbox({
  full_name,
  cafe_name,
  phone,
  email,
  subject,
  message,
}) {
  const safe = {
    full_name: escapeHtml(full_name),
    cafe_name: escapeHtml(cafe_name),
    phone: escapeHtml(phone),
    email: escapeHtml(email || "—"),
    subject: escapeHtml(subject),
    message: escapeHtml(message).replace(/\n/g, "<br />"),
  };

  const text = [
    "New SERVE contact inquiry",
    "",
    `Name: ${full_name}`,
    `Cafe: ${cafe_name || "—"}`,
    `Phone: ${phone || "—"}`,
    `Email: ${email || "—"}`,
    `Interest: ${subject}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1a0f0a">
      <h2 style="margin:0 0 12px">New SERVE contact inquiry</h2>
      <p style="margin:0 0 16px;color:#7a6258">Someone reached out from the public site.</p>
      <table style="border-collapse:collapse;width:100%;max-width:560px">
        <tr><td style="padding:6px 0;color:#7a6258;width:110px">Name</td><td style="padding:6px 0"><strong>${safe.full_name}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#7a6258">Cafe</td><td style="padding:6px 0">${safe.cafe_name || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#7a6258">Phone</td><td style="padding:6px 0">${safe.phone || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#7a6258">Email</td><td style="padding:6px 0">${safe.email}</td></tr>
        <tr><td style="padding:6px 0;color:#7a6258">Interest</td><td style="padding:6px 0">${safe.subject}</td></tr>
      </table>
      <div style="margin-top:18px;padding:14px 16px;background:#f5efe6;border-radius:12px">
        <div style="font-size:12px;color:#7a6258;margin-bottom:6px">Message</div>
        <div>${safe.message}</div>
      </div>
    </div>
  `;

  return sendPlatformMail({
    to: SERVE_INBOX,
    subject: `[SERVE Lead] ${subject} — ${full_name}`,
    text,
    html,
  });
}

const create = async (req) => {
  try {
    const phone = String(req.body.phone || "").trim();
    const cafeName = String(req.body.cafe_name || "").trim();
    const emailRaw = String(req.body.email || "").trim();
    const fullName = String(req.body.full_name || "").trim();
    const subject = String(req.body.subject || "").trim();
    const messageRaw = String(req.body.message || "").trim();
    const email =
      emailRaw ||
      (phone
        ? `phone+${phone.replace(/\D/g, "").slice(-12)}@lead.local`
        : "");

    const extras = [];
    if (cafeName) extras.push(`Cafe: ${cafeName}`);
    if (phone) extras.push(`Phone: ${phone}`);
    const messageBody = [messageRaw, ...extras].filter(Boolean).join("\n\n");

    const payload = {
      full_name: fullName,
      email,
      subject,
      message: messageBody,
    };

    const result = await contactModel.create(payload);

    if (!result) {
      return {
        ...generalConstant.EN.CONTACT.CREATE_CONTACT_FAILURE,
        data: null,
      };
    }

    await notifyServeInbox({
      full_name: fullName,
      cafe_name: cafeName,
      phone,
      email: emailRaw,
      subject,
      message: messageRaw || "No additional details provided.",
    }).catch((err) => {
      console.error("SERVE inbox mail error:", err.message);
    });

    if (emailRaw) {
      const placeholders = {
        name: fullName,
        email: emailRaw,
      };
      await sendMail("contactEnquiry", placeholders, emailRaw).catch((err) => {
        console.error("Contact mail error:", err.message);
      });
    }

    return {
      ...generalConstant.EN.CONTACT.CREATE_CONTACT_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const list = async (req) => {
  try {
    const { limit, page } = req.query;

    const filters = {};
    const include = [];
    const result = await paginate(contactModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        ...generalConstant.EN.CONTACT.CONTACT_LIST_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.CONTACT.CONTACT_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const result = await contactModel.findByPk(+req.params.id);
    if (!result) {
      return {
        ...generalConstant.EN.CONTACT.CONTACT_NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.CONTACT.CONTACT_FOUND,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const result = await contactModel.findByPk(+req.params.id);
    if (!result) {
      return {
        ...generalConstant.EN.CONTACT.CONTACT_DELETE_FAILURE,
        data: null,
      };
    }
    await result.destroy();
    return {
      ...generalConstant.EN.CONTACT.DELETE_CONTACT_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  getById,
  list,
  deleteById,
};
