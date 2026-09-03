"use strict";

const { platformEmailTemplateModel } = require("../models");
const { sendPlatformMail } = require("../utils/mailer");
const { cafePublicUrl } = require("./pos-public-url");
const { replacePlaceholders } = require("../helpers/get-active-email-template");
const logger = require("../configs/logger");

const PUBLIC_SEARCH = { searchPath: "public" };

const TEMPLATE_CATALOG = [
  {
    key: "cafe_created",
    label: "Cafe created",
    description: "Welcome email sent when a new cafe is provisioned.",
    trigger: "Create cafe",
    variables: [
      "cafeName",
      "ownerName",
      "ownerUsername",
      "ownerPassword",
      "posUrl",
      "trialEndsAt",
      "status",
    ],
  },
  {
    key: "cafe_activated",
    label: "Cafe activated",
    description: "Sent when a cafe is activated from trial or expired.",
    trigger: "Activate cafe",
    variables: ["cafeName", "ownerName", "posUrl"],
  },
  {
    key: "cafe_unsuspended",
    label: "Cafe unsuspended",
    description: "Sent when a suspended cafe is restored.",
    trigger: "Unsuspend cafe",
    variables: ["cafeName", "ownerName", "restoredStatus", "posUrl"],
  },
  {
    key: "cafe_suspended",
    label: "Cafe suspended",
    description: "Sent when a cafe is suspended.",
    trigger: "Suspend cafe",
    variables: ["cafeName", "ownerName", "reason"],
  },
  {
    key: "cafe_trial_extended",
    label: "Trial extended",
    description: "Sent when an operator extends the cafe trial.",
    trigger: "Extend trial",
    variables: ["cafeName", "ownerName", "days", "trialEndsAt", "posUrl"],
  },
];

function wrapHtml({ title, bodyHtml, ctaUrl, ctaLabel }) {
  const cta = ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0"><tr><td><a href="{posUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:600">${ctaLabel || "Open POS"}</a></td></tr></table>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:32px 16px;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(15,23,42,0.06)"><tr><td style="background:#18181b;padding:20px 28px"><p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff">Serve</p></td></tr><tr><td style="padding:28px"><h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;font-weight:700;color:#0f172a">${title}</h1>${bodyHtml}${cta}<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #f1f5f9;font-size:12px;line-height:1.5;color:#94a3b8">You received this because an action was taken on your cafe account.</p></td></tr></table></td></tr></table></body></html>`;
}

const p = (html) =>
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#475569">${html}</p>`;

const EDITABLE_SOURCES = {
  cafe_created: {
    subject: "Welcome to Serve — {cafeName} is ready",
    bodyHtml: wrapHtml({
      title: "Your cafe is ready",
      bodyHtml:
        p("Hi {ownerName},") +
        p("Welcome to <strong style=\"color:#0f172a\">Serve</strong>. <strong>{cafeName}</strong> is set up and ready to use.") +
        p("Sign in with username <strong>{ownerUsername}</strong> and temporary password <strong>{ownerPassword}</strong>.") +
        p("Trial ends on <strong>{trialEndsAt}</strong>."),
      ctaUrl: "{posUrl}",
      ctaLabel: "Open your POS",
    }),
    bodyText:
      "Hi {ownerName},\n\nWelcome to Serve. {cafeName} is ready.\n\nUsername: {ownerUsername}\nTemporary password: {ownerPassword}\nTrial ends: {trialEndsAt}\n\nOpen POS: {posUrl}",
  },
  cafe_activated: {
    subject: "{cafeName} is now active",
    bodyHtml: wrapHtml({
      title: "Cafe activated",
      bodyHtml:
        p("Hi {ownerName},") +
        p("<strong>{cafeName}</strong> is now <strong style=\"color:#166534\">active</strong>. You have full access to all POS features."),
      ctaUrl: "{posUrl}",
      ctaLabel: "Open your POS",
    }),
    bodyText:
      "Hi {ownerName},\n\n{cafeName} is now active. Full POS access is enabled.\n\nOpen POS: {posUrl}",
  },
  cafe_unsuspended: {
    subject: "{cafeName} has been restored",
    bodyHtml: wrapHtml({
      title: "Account restored",
      bodyHtml:
        p("Hi {ownerName},") +
        p("<strong>{cafeName}</strong> is active again. Your status is now <strong>{restoredStatus}</strong>."),
      ctaUrl: "{posUrl}",
      ctaLabel: "Open your POS",
    }),
    bodyText:
      "Hi {ownerName},\n\n{cafeName} has been restored. Status: {restoredStatus}.\n\nOpen POS: {posUrl}",
  },
  cafe_suspended: {
    subject: "{cafeName} has been suspended",
    bodyHtml: wrapHtml({
      title: "Cafe suspended",
      bodyHtml:
        p("Hi {ownerName},") +
        p("<strong>{cafeName}</strong> has been suspended. POS access is paused until your account is restored.") +
        `<div style="margin:16px 0 0;padding:14px 16px;background:#fef2f2;border-radius:10px;border:1px solid #fecaca"><p style="margin:0;font-size:14px;line-height:1.5;color:#991b1b"><strong>Reason:</strong> {reason}</p></div>`,
    }),
    bodyText:
      "Hi {ownerName},\n\n{cafeName} has been suspended.\nReason: {reason}\n\nContact support if you need help.",
  },
  cafe_trial_extended: {
    subject: "Trial extended — {cafeName}",
    bodyHtml: wrapHtml({
      title: "Trial extended",
      bodyHtml:
        p("Hi {ownerName},") +
        p("Your trial for <strong>{cafeName}</strong> was extended by <strong>{days} days</strong>.") +
        p("New trial end date: <strong>{trialEndsAt}</strong>."),
      ctaUrl: "{posUrl}",
      ctaLabel: "Open your POS",
    }),
    bodyText:
      "Hi {ownerName},\n\nTrial extended by {days} days for {cafeName}.\nNew end date: {trialEndsAt}.\n\nOpen POS: {posUrl}",
  },
};

function formatMailDate(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function humanizeStatus(status) {
  const map = {
    trial: "Trial",
    active: "Active",
    expired: "Expired",
    suspended: "Suspended",
    provisioning: "Provisioning",
    failed: "Failed",
  };
  return map[String(status || "").toLowerCase()] || String(status || "—");
}

function greeting(ownerName, cafeName) {
  const name = String(ownerName || cafeName || "").trim();
  return name || "there";
}

function getSampleMailContext() {
  return {
    cafeName: "Hillside Cafe",
    ownerName: "Alex Owner",
    ownerUsername: "hillsidecafe",
    ownerPassword: "ServeTemp123!",
    posUrl: "https://hillside-cafe.servecafe.app",
    trialEndsAt: "Sep 15, 2026",
    status: "Trial",
    restoredStatus: "Trial",
    reason: "Payment overdue",
    days: "7",
  };
}

function flattenMailContext(ctx) {
  return {
    cafeName: String(ctx.cafeName || ""),
    ownerName: greeting(ctx.ownerName, ctx.cafeName),
    ownerUsername: String(ctx.ownerUsername || ""),
    ownerPassword:
      ctx.passwordGenerated && ctx.ownerPassword
        ? String(ctx.ownerPassword)
        : "",
    posUrl: String(ctx.posUrl || ""),
    trialEndsAt: ctx.trialEndsAt ? formatMailDate(ctx.trialEndsAt) : "",
    status: humanizeStatus(ctx.status),
    restoredStatus: humanizeStatus(ctx.restoredStatus),
    reason: String(ctx.reason || ""),
    days: String(ctx.days ?? ""),
  };
}

function getEditableSource(templateKey) {
  const source = EDITABLE_SOURCES[templateKey];
  if (!source) {
    throw new Error(`Unknown template: ${templateKey}`);
  }
  return source;
}

function renderMailFromSource(source, replacements) {
  return {
    subject: replacePlaceholders(source.subject, replacements),
    html: replacePlaceholders(source.bodyHtml, replacements),
    text: replacePlaceholders(source.bodyText, replacements),
  };
}

async function resolveTemplateSource(templateKey) {
  const override = await platformEmailTemplateModel.findOne({
    where: { templateKey },
    ...PUBLIC_SEARCH,
  });
  if (override) {
    const row = override.toJSON ? override.toJSON() : override;
    return {
      subject: row.subject,
      bodyHtml: row.bodyHtml,
      bodyText: row.bodyText,
    };
  }
  return getEditableSource(templateKey);
}

function buildMailContext(tenant, extras = {}, req) {
  const slug = tenant.slug;
  return {
    cafeName: tenant.name,
    slug,
    ownerName: extras.ownerName || tenant.name,
    ownerEmail: tenant.ownerEmail,
    ownerUsername: extras.ownerUsername || null,
    ownerPassword: extras.ownerPassword || null,
    passwordGenerated: Boolean(extras.passwordGenerated),
    status: tenant.status,
    trialEndsAt: tenant.trialEndsAt,
    restoredStatus: extras.restoredStatus || null,
    reason: extras.reason || null,
    days: extras.days || null,
    posUrl: slug ? cafePublicUrl(slug, req) : null,
  };
}

async function notifyCafeOwner(templateKey, tenant, extras = {}, req) {
  if (!EDITABLE_SOURCES[templateKey]) {
    logger.warn(`[platform-cafe-mail] Unknown template: ${templateKey}`);
    return { delivered: false };
  }

  const to = String(tenant?.ownerEmail || "").trim();
  if (!to) {
    logger.warn(
      `[platform-cafe-mail] Skipped ${templateKey} — no owner email for tenant ${tenant?.id}`,
    );
    return { delivered: false };
  }

  const ctx = buildMailContext(tenant, extras, req);
  const flat = flattenMailContext(ctx);
  const source = await resolveTemplateSource(templateKey);
  const { subject, html, text } = renderMailFromSource(source, flat);
  return sendPlatformMail({ to, subject, text, html });
}

function queueCafeOwnerMail(templateKey, tenant, extras = {}, req) {
  notifyCafeOwner(templateKey, tenant, extras, req).catch((err) => {
    logger.warn(
      `[platform-cafe-mail] ${templateKey} failed for tenant ${tenant?.id}: ${err.message}`,
    );
  });
}

module.exports = {
  TEMPLATE_CATALOG,
  EDITABLE_SOURCES,
  getEditableSource,
  getSampleMailContext,
  renderMailFromSource,
  notifyCafeOwner,
  queueCafeOwnerMail,
};
