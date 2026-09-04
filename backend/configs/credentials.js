const dotenv = require("dotenv");
dotenv.config();

module.exports.EMAIL = {
  HOST: process.env.EMAIL_HOST,
  PORT: process.env.EMAIL_PORT,
  USERNAME: process.env.EMAIL_USERNAME,
  PASSWORD: process.env.EMAIL_PASSWORD,
  SECURE: process.env.EMAIL_SECURE,
};

function resolveJwtSecret() {
  const fromEnv = String(process.env.JWT_SECRET || "").trim();
  const isProd =
    process.env.NODE_ENV === "production" || process.env.ENV === "production";
  const hint =
    "Set JWT_SECRET in backend/.env (min 32 chars). Example: openssl rand -hex 32";

  if (fromEnv.length >= 32) return fromEnv;
  if (isProd || !fromEnv) {
    throw new Error(`JWT_SECRET is missing or too short. ${hint}`);
  }
  return fromEnv;
}

module.exports.JWT_SECRET = resolveJwtSecret();

module.exports.HTTP_SECURE = process.env.HTTP_SECURE === "true";

module.exports.SERVER_PORT = process.env.SERVER_PORT;

module.exports.ACCOUNTING_APP_PROXY_URL_V1 =
  process.env.ACCOUNTING_APP_PROXY_URL_V1;
