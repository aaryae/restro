const useragent = require("useragent");
const ip = require("ip");
const infoMiddleware = {};

infoMiddleware.retrieveClientPlatform = async (req, res, next) => {
  try {
    let platform = req.headers["platform"];
    if (platform) {
      if (
        platform == "android" ||
        platform == "Android" ||
        platform == "ios" ||
        platform == "Ios"
      ) {
        req.mobile = platform;
      } else {
        platform = "web";
      }
    } else {
      platform = "web";
    }
    req.platform = platform;
    return next();
  } catch (err) {
    next(err);
  }
};

infoMiddleware.getClientInfo = async (req, res, next) => {
  let info = {};
  let agent = useragent.parse(req.headers["user-agent"]);
  info.browser = agent.toAgent().toString();
  info.os = agent.os.toString();
  info.device = agent.device.toString();
  info.ip = ip.address();
  req.client_info = info;
  return next();
};

module.exports = infoMiddleware;
