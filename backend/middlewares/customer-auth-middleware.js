const { verifyCustomerToken } = require("../helpers/jwt-helper");

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Customer ")) {
      return res.status(401).json({ success: false, msg: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = await verifyCustomerToken(token);

    if (!decoded) {
      return res.status(403).json({
        status: 403,
        success: false,
        msg: "JWT expired.",
      });
    }

    req.user = decoded;
    req.user.role = "customer";
    next();
  } catch (error) {
    return res.status(401).json({ success: false, msg: "Invalid token" });
  }
};

module.exports = authenticateUser;
