const trashHelper = require("../../helpers/trash-helper");

const list = async (req) => trashHelper.listTrash(req);

const restore = async (req) => trashHelper.restoreTrashItem(req);

const permanentlyDelete = async (req) =>
  trashHelper.permanentlyDeleteTrashItem(req);

module.exports = { list, restore, permanentlyDelete };
