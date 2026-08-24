const { activeTemplateModel, emailTemplateModel } = require("../models");

const getActiveTemplate = async (actionKey) => {
  const activeTemplate = await activeTemplateModel.findOne({
    where: { actionKey },
    include: [
      {
        model: emailTemplateModel,
        as: "emailTemplate",
      },
    ],
  });

  if (!activeTemplate) {
    throw new Error(`No active template found for actionKey: ${actionKey}`);
  }

  return activeTemplate.emailTemplate;
};

const replacePlaceholders = (templateString, replacements = {}) => {
  if (!templateString) return "";

  return templateString.replace(/\{(\w+)\}/g, (match, key) => {
    return typeof replacements[key] !== "undefined" ? replacements[key] : match;
  });
};

module.exports = { getActiveTemplate, replacePlaceholders };
