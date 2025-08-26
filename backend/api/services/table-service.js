const { tableModel, orderModel, floorModel } = require("../../models");
const { Op } = require("sequelize");
const paginate = require("../../utils/paginate");
const generateUUID = require("../../utils/uuidGenerator");

const create = async (req) => {
  try {
    const isNameUsed = await tableModel.findOne({
      where: {
        tableNo: req.body.tableNo,
        floorId: req.body.floorId,
      },
    });

    if (isNameUsed) {
      return {
        status: 400,
        success: false,
        message: `Table with this number already exists on this floor`,
      };
    }

    const result = await tableModel.create(req.body);
    if (!result) {
      return {
        status: 500,
        success: false,
        message: `Table create failed`,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Table create successfully`,
    };
  } catch (error) {
    throw error;
  }
};

const list = async (req) => {
  try {
    let { limit, page, floorId, tableNo } = req.query;
    const filters = {};
    const include = [{ model: floorModel, as: "floor" }];

    if (floorId) {
      filters.floorId = {
        [Op.like]: `%${floorId}%`,
      };
    }
    if (tableNo) {
      filters.tableNo = {
        [Op.like]: `%${tableNo}%`,
      };
    }

    const result = await paginate(tableModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        status: 500,
        success: false,
        message: `Table List Failed`,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Table List successfully`,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const result = await tableModel.findByPk(+req.params.id, {
      include: {
        model: orderModel,
        as: "orders",
      },
      include: { model: floorModel, as: "floor" },
    });
    if (!result) {
      return {
        status: 404,
        success: false,
        message: `Table Not Found`,
        data: null,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Table Get successfully`,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const result = await tableModel.findByPk(+req.params.id);
    if (!result) {
      return {
        status: 404,
        success: false,
        message: `Table Not Found`,
        data: null,
      };
    }

    const deleted = await result.destroy();
    if (!deleted) {
      return {
        status: 500,
        success: false,
        message: `Table delete failed`,
        data: null,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Table delete successfully`,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

const updateTableStatus = async (req) => {
  try {
    const { id } = req.params;
    const { status, ...otherUpdates } = req.body;

    const table = await tableModel.findByPk(id);
    if (!table) {
      return {
        status: 404,
        success: false,
        message: "Table not found",
      };
    }

    if (status === "available" || status === "maintenance") {
      table.currentSessionId = null;
      table.sessionStartTime = null;
    } else if (status === "occupied") {
      if (!table.currentSessionId) {
        table.currentSessionId = generateUUID.generateUUID();
        table.sessionStartTime = new Date();
      } else {
        return {
          status: 200,
          success: true,
          message: `Table is already occupied`,
          data: table,
        };
      }
    }

    Object.assign(table, otherUpdates);

    table.status = status;
    const updatedTable = await table.save();

    return {
      status: 200,
      success: true,
      message: "Table status updated successfully",
      data: updatedTable,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  list,
  getById,
  updateTableStatus,
  deleteById,
};
