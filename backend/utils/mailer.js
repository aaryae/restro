const nodemailer = require("nodemailer");
const { smtpModel } = require("../models");
const generalConstant = require("../constants/general-constant");
const logger = require("../configs/logger");
const { EMAIL } = require("../configs/credentials");

const {
  getActiveTemplate,
  replacePlaceholders,
} = require("../helpers/get-active-email-template");

function envFlagTrue(value, fallback) {
  if (value == null || String(value).trim() === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function isProduction() {
  const env = String(process.env.NODE_ENV || process.env.ENV || "").toLowerCase();
  return env === "production";
}

function getEnvSmtpTransport() {
  const user = String(EMAIL.USERNAME || process.env.EMAIL_USERNAME || "").trim();
  const pass = String(EMAIL.PASSWORD || process.env.EMAIL_PASSWORD || "").replace(
    /\s+/g,
    "",
  );
  if (!user || !pass) return null;

  const port = Number(EMAIL.PORT || process.env.EMAIL_PORT || 465);
  const secure = envFlagTrue(EMAIL.SECURE ?? process.env.EMAIL_SECURE, port === 465);
  const from = String(process.env.EMAIL_FROM || user).trim();

  return {
    smtpConf: { username: user, from },
    transporter: nodemailer.createTransport({
      host: EMAIL.HOST || process.env.EMAIL_HOST || "smtp.gmail.com",
      port,
      secure,
      auth: { user, pass },
    }),
  };
}

async function getDbSmtpTransport({ publicOnly = false } = {}) {
  try {
    const smtpConf = await smtpModel.findOne(
      publicOnly ? { searchPath: "public" } : undefined,
    );
    if (!smtpConf) return null;

    return {
      smtpConf,
      transporter: nodemailer.createTransport({
        host: smtpConf.host || "smtp.gmail.com",
        port: smtpConf.port || 465,
        secure: Boolean(smtpConf.secure),
        auth: {
          user: String(smtpConf.username || "").trim(),
          pass: String(smtpConf.passkey || "").replace(/\s+/g, ""),
        },
      }),
    };
  } catch (err) {
    logger.warn(`[SMTP] unavailable: ${err.message}`);
    return null;
  }
}

async function getSmtpTransport({ publicOnly = false } = {}) {
  // Env SMTP is for Serve (public) OTP / reset mail only.
  // Cafe POS transactional mail must keep using the tenant smtp row.
  if (publicOnly) {
    const fromEnv = getEnvSmtpTransport();
    if (fromEnv) return fromEnv;
    return getDbSmtpTransport({ publicOnly: true });
  }
  return getDbSmtpTransport({ publicOnly: false });
}

function mailFrom(transport) {
  return (
    process.env.EMAIL_FROM ||
    process.env.EMAIL_USERNAME ||
    transport?.smtpConf?.from ||
    transport?.smtpConf?.username ||
    ""
  );
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * sendMail - a function that fetches the active template by actionKey,
 *            replaces placeholdgeneralers, and sends the email.
 *
 * @param {string} actionKey - e.g. 'verify_mail', 'approval', 'reject'
 * @param {object} replacements - object containing placeholders => values
 * @param {string} recipientEmail - the user's email address
 *
 * @return {Promise<string>} - messageId from nodemailer
 */
const sendMail = async (actionKey, replacements, recipientEmail) => {
  const transport = await getSmtpTransport();
  if (!transport) {
    return {
      ...generalConstant.EN.SMTP.SMTP_GET_FAILURE,
      data: null,
    };
  }

  const template = await getActiveTemplate(actionKey);

  // 2. Replace placeholders in subject & body
  const finalSubject = replacePlaceholders(template.subject, replacements);
  const finalBody = replacePlaceholders(template.body, replacements);

  // 3. Send mail with nodemailer
  const info = await transport.transporter.sendMail({
    from: template.from || mailFrom(transport),
    to: recipientEmail,
    subject: finalSubject,
    // If your template is HTML, use 'html'
    html: finalBody,
    // If you want to add an alternate text, replace placeholders there as well:
    text: replacePlaceholders(template.alternateText, replacements),
  });

  return info.messageId;
};

function otpCopy(purpose) {
  if (purpose === "reset") {
    return {
      subject: "Your Serve password reset code",
      text: (name, otp) =>
        `Hi ${name || "there"},\n\nYour Serve password reset code is ${otp}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email. Your password will stay the same.`,
      html: (name, otp) =>
        `<p>Hi ${escapeHtml(name) || "there"},</p><p>Your Serve password reset code is <strong style="font-size:20px;letter-spacing:2px">${escapeHtml(otp)}</strong>.</p><p>It expires in 10 minutes.</p><p>If you did not request this, ignore this email. Your password will stay the same.</p>`,
    };
  }
  return {
    subject: "Your Serve verification code",
    text: (name, otp) =>
      `Hi ${name || "there"},\n\nYour Serve verification code is ${otp}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email.`,
    html: (name, otp) =>
      `<p>Hi ${escapeHtml(name) || "there"},</p><p>Your Serve verification code is <strong style="font-size:20px;letter-spacing:2px">${escapeHtml(otp)}</strong>.</p><p>It expires in 10 minutes.</p><p>If you did not request this, ignore this email.</p>`,
  };
}

/**
 * Send a one-time code email. Falls back to console logging when SMTP is missing
 * so local/dev registration still works. Never logs the code in production.
 */
const sendOtpMail = async ({ to, name, otp, purpose = "verify" }) => {
  const copy = otpCopy(purpose);
  const subject = copy.subject;
  const text = copy.text(name, otp);
  const html = copy.html(name, otp);

  const transport = await getSmtpTransport({ publicOnly: true });
  if (!transport) {
    if (!isProduction()) {
      logger.warn(`[OTP] SMTP not configured. Code for ${to}: ${otp}`);
    } else {
      logger.warn(`[OTP] SMTP not configured; code not logged in production`);
    }
    return { delivered: false, logged: !isProduction() };
  }

  const from = mailFrom(transport);
  if (!from) {
    logger.error("[OTP] Refusing to send mail with an empty From address");
    return { delivered: false, logged: false };
  }

  try {
    await transport.transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    return { delivered: true, logged: false };
  } catch (err) {
    logger.error(`[OTP] Failed to email ${to}: ${err.message}`);
    if (!isProduction()) {
      logger.warn(`[OTP] Fallback code for ${to}: ${otp}`);
    }
    return { delivered: false, logged: !isProduction() };
  }
};

module.exports = { sendMail, sendOtpMail };
