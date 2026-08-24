const axios = require("axios");
const { actionRequestModel, userModel } = require("../models");
const { sendNotification } = require("../helpers/send-notification");
const { EN } = require("../constants/message-constant");
const { mailer, sendMail } = require("../utils/mailer");

/**
 * Executes a dynamic API call based on the stored ActionRequest.
 * @param {number} actionRequestId - The ID of the ActionRequest to execute.
 * @param {string} token - The authorization token to be included in the API call headers.
 * @returns {Promise<Object>} - The API response or an error object.
 */
const executeApiCall = async (actionRequestId, token) => {
  try {
    const actionRequest = await actionRequestModel.findOne({
      where: { id: actionRequestId },
    });
    if (!actionRequest || actionRequest?.status !== "Pending") {
      console.log("error");
      return {
        status: 404,
        success: false,
        msg: `No pending ActionRequest found with ID: ${actionRequestId}`,
      };
    }

    let { endpoint, method, params, query, requestBody } = actionRequest;
    if (params && typeof params === "object") {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(`:${key}`, value);
      });
    }
    //prod
    let url = new URL(`/api/v1${endpoint}`, "http://backend:3333/api/v1");

    //dev
    // let url = new URL(`/api/v1${endpoint}`, "http://localhost:8080/api/v1");

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await axios({
      url: url.toString(),
      method: method,
      params,
      data: requestBody,
      headers: {
        Authorization: token,
      },
    });

    const updated = await actionRequest.update({ status: "Approved" });
    const user = await userModel.findByPk(actionRequest.userId, {
      include: {
        model: userModel,
        as: "supervisor",
      },
    });
    if (!user) {
      return {
        status: 404,
        success: false,
        msg: "User not found",
      };
    }
    // websocket notification
    await sendNotification(
      user.username,
      actionRequest.userId,
      user.supervisorId,
      EN.APPROVAL_SUCCESS,
      "Approved",
      actionRequest.id,
    );

    //email notification
    const placeholders = {
      name: user.username,
      senderUserName: user?.supervisor?.username,
      requestId: actionRequest.id.toString(),
      email: user.email,
      supervisorId: user.supervisorId,
    };

    sendMail("requestApprovalSuccess", placeholders, user.email).catch(
      (error) => {
        // Log the error without throwing it further
        console.error("Mail sending error:", error);
      },
    );
    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    const updated = await actionRequestModel.update(
      { status: "Rejected" },
      { returning: true, where: { id: actionRequestId } },
    );
    const actionRequest = await actionRequestModel.findOne({
      where: { id: actionRequestId },
    });
    const user = await userModel.findByPk(actionRequest.userId, {
      include: {
        model: userModel,
        as: "supervisor",
      },
    });
    if (!user) {
      return {
        status: 404,
        success: false,
        msg: "User not found",
      };
    }
    await sendNotification(
      user.username,
      actionRequest.userId,
      user.supervisorId,
      EN.APPROVAL_FAILURE,
      "Rejected",
      actionRequest.id,
    );

    const placeholders = {
      name: user.username,
      senderUserName: user?.supervisor?.username,
      requestId: actionRequest.id.toString(),
      email: user.email,
      supervisorId: user.supervisorId,
    };
    sendMail("Rejected", placeholders, user.email).catch((error) => {
      // Log the error without throwing it further
      console.error("Mail sending error:", error);
    });

    return {
      status: error?.status || 500,
      success: error.response?.data?.success,
      data: updated,
      msg: error?.response?.data.message,
      // "An error occurred while executing the API call",
    };
  }
};

const reject = async (actionRequest) => {
  if (
    actionRequest?.status === "Approved" ||
    actionRequest?.status === "Rejected"
  ) {
    return {
      status: 400,
      success: false,
      msg: "Action request has already been processed",
    };
  }
  const updated = await actionRequest.update({ status: "Rejected" });
  const user = await userModel.findByPk(actionRequest.userId, {
    include: {
      model: userModel,
      as: "supervisor",
    },
  });
  if (!user) {
    return {
      status: 404,
      success: false,
      msg: "User not found",
    };
  }
  await sendNotification(
    user.username,
    actionRequest.userId,
    user.supervisorId,
    EN.APPROVAL_FAILURE,
    "Rejected",
    actionRequest.id,
  );

  const placeholders = {
    name: user.username,
    senderUserName: user?.supervisor?.username,
    requestId: actionRequest.id.toString(),
    email: user.email,
    supervisorId: user?.supervisorId,
  };
  sendMail("Rejected", placeholders, user.email).catch((error) => {
    // Log the error without throwing it further
    console.error("Mail sending error:", error);
  });

  return {
    status: 200,
    success: true,
    data: updated,
    msg: "Action Request Rejected Successfully",
  };
};

module.exports = { executeApiCall, reject };
