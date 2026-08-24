const nodemailer = require("nodemailer");
const { smtpModel } = require("../models");
const generalConstant = require("../constants/general-constant");
const logger = require("../configs/logger");

const {
  getActiveTemplate,
  replacePlaceholders,
} = require("../helpers/get-active-email-template");

async function getSmtpTransport() {
  const smtpConf = await smtpModel.findOne();
  if (!smtpConf) return null;

  return {
    smtpConf,
    transporter: nodemailer.createTransport({
      host: smtpConf.host || "smtp.gmail.com",
      port: smtpConf.port || 465,
      secure: smtpConf.secure || true,
      auth: {
        user: smtpConf.username,
        pass: smtpConf.passkey,
      },
    }),
  };
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
    from: template.from || process.env.EMAIL_USERNAME,
    to: recipientEmail,
    subject: finalSubject,
    // If your template is HTML, use 'html'
    html: finalBody,
    // If you want to add an alternate text, replace placeholders there as well:
    text: replacePlaceholders(template.alternateText, replacements),
  });

  return info.messageId;
};

/**
 * Send a one-time code email. Falls back to console logging when SMTP is missing
 * so local/dev registration still works.
 */
const sendOtpMail = async ({ to, name, otp }) => {
  const subject = "Your Serve verification code";
  const text = `Hi ${name || "there"},\n\nYour Serve verification code is ${otp}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email.`;
  const html = `<p>Hi ${name || "there"},</p><p>Your Serve verification code is <strong style="font-size:20px;letter-spacing:2px">${otp}</strong>.</p><p>It expires in 10 minutes.</p><p>If you did not request this, ignore this email.</p>`;

  const transport = await getSmtpTransport();
  if (!transport) {
    logger.warn(`[OTP] SMTP not configured. Code for ${to}: ${otp}`);
    return { delivered: false, logged: true };
  }

  try {
    await transport.transporter.sendMail({
      from: process.env.EMAIL_USERNAME || transport.smtpConf.username,
      to,
      subject,
      text,
      html,
    });
    return { delivered: true, logged: false };
  } catch (err) {
    logger.error(`[OTP] Failed to email ${to}: ${err.message}`);
    logger.warn(`[OTP] Fallback code for ${to}: ${otp}`);
    return { delivered: false, logged: true };
  }
};

module.exports = { sendMail, sendOtpMail };
