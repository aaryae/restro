const dotenv = require("dotenv");
dotenv.config();

module.exports.EMAIL = {
  HOST: process.env.EMAIL_HOST,
  PORT: process.env.EMAIL_PORT,
  USERNAME: process.env.EMAIL_USERNAME,
  PASSWORD: process.env.EMAIL_PASSWORD,
  SECURE: process.env.EMAIL_SECURE,
};

module.exports.JWT_SECRET = process.env.JWT_SECRET || "secret";

module.exports.HTTP_SECURE = process.env.HTTP_SECURE === "true";

module.exports.SERVER_PORT = process.env.SERVER_PORT;

module.exports.ACCOUNTING_APP_PROXY_URL_V1 =
  process.env.ACCOUNTING_APP_PROXY_URL_V1;
