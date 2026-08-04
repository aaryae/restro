const { tableModel, orderModel, floorModel } = require("../../models");
const { Op } = require("sequelize");
const paginate = require("../../utils/paginate");
const generateUUID = require("../../utils/uuidGenerator");

const ACTIVE_ORDER_STATUSES = ["completed", "cancelled"];

const reconcileOccupiedTablesWithoutOrders = async (tables = []) => {
  const occupiedTables = tables.filter((table) => table.status === "occupied");
  if (occupiedTables.length === 0) return tables;

  const occupiedIds = occupiedTables.map((table) => table.id);
  const activeOrders = await orderModel.findAll({
    where: {
      tableId: { [Op.in]: occupiedIds },
      status: { [Op.notIn]: ACTIVE_ORDER_STATUSES },
    },
    attributes: ["tableId"],
    raw: true,
  });

  const tablesWithActiveOrders = new Set(
    activeOrders.map((order) => order.tableId),
  );
  const staleTableIds = occupiedIds.filter(
    (id) => !tablesWithActiveOrders.has(id),
  );

  if (staleTableIds.length === 0) return tables;

  await tableModel.update(
    { status: "available", sessionId: null, sessionStartTime: null },
    { where: { id: { [Op.in]: staleTableIds } } },
  );

  tables.forEach((table) => {
    if (staleTableIds.includes(table.id)) {
      table.status = "available";
      table.sessionId = null;
      table.sessionStartTime = null;
    }
  });

  return tables;
};

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
      // Exact match: floorId is an integer (Postgres rejects LIKE on ints)
      filters.floorId = +floorId;
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

    if (result?.data?.length) {
      await reconcileOccupiedTablesWithoutOrders(result.data);
    }

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
    const tableId = +req.params.id;
    const result = await tableModel.findByPk(tableId);
    if (!result) {
      return {
        status: 404,
        success: false,
        message: `Table Not Found`,
        data: null,
      };
    }

    // Check if table is currently occupied
    if (result.status === "occupied") {
      return {
        status: 400,
        success: false,
        message: "The table is currently occupied.",
        data: null,
      };
    }

    const { archiveToTrash } = require("../../helpers/trash-helper");
    await archiveToTrash({ resourceType: "table", record: result, req });
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
      table.sessionId = null;
      table.sessionStartTime = null;
    } else if (status === "occupied") {
      if (!table.sessionId) {
        table.sessionId = generateUUID.generateUUID();
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

    if (status) table.status = status;
    const updatedTable = await table.save();

    return {
      status: 200,
      success: true,
      message: "Table updated successfully",
      data: updatedTable,
    };
  } catch (error) {
    throw error;
  }
};

const moveOrders = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { sourceTableId, destinationTableId, orderIds } = req.body;

    // Validate source and destination tables
    const sourceTable = await tableModel.findByPk(+sourceTableId, {
      include: [{ model: orderModel, as: "orders" }],
      transaction,
    });
    const destinationTable = await tableModel.findByPk(+destinationTableId, {
      transaction,
    });

    if (!sourceTable) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: "Source table not found",
        data: null,
      };
    }

    if (!destinationTable) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: "Destination table not found",
        data: null,
      };
    }

    // Validate destination table status
    if (destinationTable.status !== "available") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Destination table must be available to accept orders",
        data: null,
      };
    }

    // Determine which orders to move
    let ordersToMove;
    if (Array.isArray(orderIds) && orderIds.length > 0) {
      // Partial move: validate specified order IDs
      ordersToMove = await orderModel.findAll({
        where: {
          id: { [Op.in]: orderIds },
          tableId: sourceTableId,
        },
        transaction,
      });

      if (ordersToMove.length !== orderIds.length) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message:
            "Some specified orders are invalid or do not belong to the source table",
          data: null,
        };
      }
    } else {
      // Move all orders
      ordersToMove = sourceTable.orders || [];
    }

    if (ordersToMove.length === 0) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "No orders found to move from the source table",
        data: null,
      };
    }

    const destSessionId = generateUUID.generateUUID();

    // Update orders with new tableId and session
    await orderModel.update(
      { tableId: destinationTableId, sessionId: destSessionId },
      {
        where: { id: ordersToMove.map((order) => order.id) },
        transaction,
      },
    );

    // Update table statuses
    if (sourceTable.orders.length === ordersToMove.length) {
      // All orders moved, set source table to available
      await sourceTable.update(
        {
          status: "available",
          sessionId: null,
          sessionStartTime: null,
        },
        { transaction },
      );
    }

    // Set destination table to occupied
    await destinationTable.update(
      {
        status: "occupied",
        sessionId: destSessionId,
        sessionStartTime: new Date(),
      },
      { transaction },
    );

    // Fetch updated tables for response
    const updatedSourceTable = await tableModel.findByPk(+sourceTableId, {
      include: [{ model: orderModel, as: "orders" }],
      transaction,
    });
    const updatedDestinationTable = await tableModel.findByPk(
      +destinationTableId,
      {
        include: [{ model: orderModel, as: "orders" }],
        transaction,
      },
    );

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: `Successfully moved ${ordersToMove.length} order(s) from table ${sourceTable.tableNo} to table ${destinationTable.tableNo}`,
      data: {
        sourceTable: updatedSourceTable,
        destinationTable: updatedDestinationTable,
      },
    };
  } catch (error) {
    console.error("MoveOrders error:", error);
    await transaction.rollback().catch((rollbackError) => {
      console.error("Rollback error:", rollbackError);
    });
    throw error;
  }
};

module.exports = {
  create,
  list,
  getById,
  updateTableStatus,
  deleteById,
  moveOrders,
};
