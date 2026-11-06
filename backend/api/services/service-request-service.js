"use strict";

const { serviceRequestModel, tableModel, floorModel } = require("../../models");
const { broadcastToTenant } = require("../../helpers/send-notification");

const listOpen = async (req) => {
  try {
    const rows = await serviceRequestModel.findAll({
      where: { status: "open", type: "bill" },
      include: [
        {
          model: tableModel,
          as: "table",
          attributes: ["id", "tableNo", "status", "sessionId", "floorId"],
          include: [
            {
              model: floorModel,
              as: "floor",
              attributes: ["id", "floorNo", "name"],
              required: false,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    return {
      status: 200,
      success: true,
      message: "Open service requests",
      data: rows.map((row) => {
        const plain = row.get({ plain: true });
        return {
          id: plain.id,
          type: plain.type,
          status: plain.status,
          sessionId: plain.sessionId,
          createdAt: plain.createdAt,
          table: plain.table
            ? {
                id: plain.table.id,
                tableNo: plain.table.tableNo,
                status: plain.table.status,
                floor: plain.table.floor || null,
              }
            : null,
          message: plain.table
            ? `Table ${plain.table.tableNo} requested the bill`
            : "A guest requested the bill",
        };
      }),
    };
  } catch (error) {
    throw error;
  }
};

const markHandled = async (req) => {
  try {
    const id = +req.params.id;
    const request = await serviceRequestModel.findByPk(id, {
      include: [
        {
          model: tableModel,
          as: "table",
          attributes: ["id", "tableNo"],
        },
      ],
    });

    if (!request) {
      return {
        status: 404,
        success: false,
        message: "Service request not found",
        data: null,
      };
    }

    if (request.status !== "open") {
      return {
        status: 200,
        success: true,
        message: "Request already handled",
        data: request,
      };
    }

    await request.update({
      status: "handled",
      handledBy: req.user?.id || null,
      handledAt: new Date(),
    });

    if (req.tenant?.slug) {
      broadcastToTenant(req.tenant.slug, {
        type: "bill_request_handled",
        requestId: request.id,
        tableId: request.tableId,
        tableNo: request.table?.tableNo || null,
      });
    }

    return {
      status: 200,
      success: true,
      message: "Marked as handled",
      data: request,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  listOpen,
  markHandled,
};
