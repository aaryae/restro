require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    dialect: process.env.DB_DIALECT || "postgres",
  },
  test: {
    username: process.env.STAGING_DB_USER,
    password: process.env.STAGING_DB_PASSWORD,
    database: process.env.STAGING_DB_NAME,
    host: process.env.STAGING_DB_HOST || "127.0.0.1",
    port: Number(process.env.STAGING_DB_PORT) || 5432,
    dialect: process.env.STAGING_DB_DIALECT || "postgres",
  },
  production: {
    username: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOST,
    port: Number(process.env.PROD_DB_PORT) || 5432,
    dialect: process.env.PROD_DB_DIALECT || "postgres",
  },
};
