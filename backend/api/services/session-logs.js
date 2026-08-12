const httpStatus = require("http-status");
const { sessionLogsModel } = require("../../models");
const ip = require("ip");
const useragent = require("useragent");
const responseHelper = require("../../helpers/response-helper");

const createSessionLog = async (sessionLogs, req) => {
  try {
    const ipAddress = ip.address();
    let userAgentInfo = {};
    const agent = useragent.parse(req.headers["user-agent"]);
    userAgentInfo.browser = agent.toAgent().toString();
    userAgentInfo.os = agent.os.toString();
    userAgentInfo.device = agent.device.toString();
    let sessionData = {
      login: new Date(),
      ipAddress,
      userId: sessionLogs.id,
      userAgent: JSON.stringify(userAgentInfo),
    };
    const sessionLog = await sessionLogsModel.create(sessionData);
    return sessionLog;
  } catch (e) {
    throw e;
  }
};

const findSingleUserLog = async (userId) => {
  try {
    const userLog = await sessionLogsModel.findOne({
      where: { userId, logout: null },
      order: [["id", "DESC"]],
      attributes: { exclude: ["updatedAt", "createdAt"] },
      raw: true,
    });
    return userLog;
  } catch (error) {
    throw error;
  }
};

const updateSessionLog = async (userSession, req, res) => {
  try {
    const userId = userSession.userId ?? userSession.id ?? userSession.user?.id;
    if (!userId) {
      return responseHelper.sendResponse(
        res,
        httpStatus.NOT_FOUND,
        false,
        null,
        null,
        "There is no session for this user",
        null,
      );
    }

    const [updatedCount] = await sessionLogsModel.update(
      { logout: new Date() },
      { where: { userId, logout: null } },
    );

    if (!updatedCount) {
      return responseHelper.sendResponse(
        res,
        httpStatus.NOT_FOUND,
        false,
        null,
        null,
        "There is no session for this user",
        null,
      );
    }

    return updatedCount;
  } catch (error) {
    throw error;
  }
};

module.exports = { createSessionLog, findSingleUserLog, updateSessionLog };
