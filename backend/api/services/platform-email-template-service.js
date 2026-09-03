"use strict";

const { platformEmailTemplateModel } = require("../../models");
const {
  TEMPLATE_CATALOG,
  getSampleMailContext,
  getEditableSource,
  renderMailFromSource,
} = require("../../lib/platform-cafe-mail");

const PUBLIC_SEARCH = { searchPath: "public" };

function serializeTemplate(item, override) {
  const source = getEditableSource(item.key);
  const subject = override?.subject ?? source.subject;
  const bodyHtml = override?.bodyHtml ?? source.bodyHtml;
  const bodyText = override?.bodyText ?? source.bodyText;
  const sample = getSampleMailContext();
  const preview = renderMailFromSource({ subject, bodyHtml, bodyText }, sample);

  return {
    key: item.key,
    label: item.label,
    description: item.description,
    trigger: item.trigger,
    variables: item.variables,
    isCustom: Boolean(override),
    subject,
    bodyHtml,
    bodyText,
    preview,
    updatedAt: override?.updatedAt || null,
  };
}

const listCafeEmailTemplates = async () => {
  const overrides = await platformEmailTemplateModel.findAll({
    ...PUBLIC_SEARCH,
  });
  const byKey = new Map(
    overrides.map((row) => {
      const json = row.toJSON ? row.toJSON() : row;
      return [json.templateKey, json];
    }),
  );

  return {
    status: 200,
    success: true,
    message: "OK",
    data: {
      items: TEMPLATE_CATALOG.map((item) =>
        serializeTemplate(item, byKey.get(item.key)),
      ),
    },
  };
};

const upsertCafeEmailTemplate = async (req) => {
  const key = String(req.params.key || "").trim();
  const catalogItem = TEMPLATE_CATALOG.find((item) => item.key === key);
  if (!catalogItem) {
    return { status: 404, success: false, message: "Template not found" };
  }

  const body = req.body || {};
  const subject = String(body.subject || "").trim();
  const bodyHtml = String(body.bodyHtml || "").trim();
  const bodyText = String(body.bodyText || "").trim();

  if (!subject) {
    return { status: 400, success: false, message: "Subject is required" };
  }
  if (!bodyHtml) {
    return { status: 400, success: false, message: "HTML body is required" };
  }
  if (!bodyText) {
    return {
      status: 400,
      success: false,
      message: "Plain-text body is required",
    };
  }

  const existing = await platformEmailTemplateModel.findOne({
    where: { templateKey: key },
    ...PUBLIC_SEARCH,
  });

  let row;
  if (existing) {
    await existing.update({ subject, bodyHtml, bodyText }, { ...PUBLIC_SEARCH });
    row = existing;
  } else {
    row = await platformEmailTemplateModel.create(
      { templateKey: key, subject, bodyHtml, bodyText },
      { ...PUBLIC_SEARCH },
    );
  }

  await row.reload({ ...PUBLIC_SEARCH });
  return {
    status: 200,
    success: true,
    message: "Template saved",
    data: serializeTemplate(catalogItem, row.toJSON ? row.toJSON() : row),
  };
};

const resetCafeEmailTemplate = async (req) => {
  const key = String(req.params.key || "").trim();
  const catalogItem = TEMPLATE_CATALOG.find((item) => item.key === key);
  if (!catalogItem) {
    return { status: 404, success: false, message: "Template not found" };
  }

  await platformEmailTemplateModel.destroy({
    where: { templateKey: key },
    ...PUBLIC_SEARCH,
  });

  return {
    status: 200,
    success: true,
    message: "Template reset to default",
    data: serializeTemplate(catalogItem, null),
  };
};

module.exports = {
  listCafeEmailTemplates,
  upsertCafeEmailTemplate,
  resetCafeEmailTemplate,
};
