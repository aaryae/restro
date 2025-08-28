"use strict";
require("dotenv").config();
require("./utils/media/deleteMediaTimer");
require("./helpers/order/cleanup-expired-carts");
require("./helpers/oauth/google-oauth-helper");
require("./helpers/oauth/facebook-oauth-helper");
require("./helpers/oauth/local-oauth-helper");
require("./helpers/passport-helper");
require("./helpers/oauth/apple-oauth-helper");

// package
const express = require("express");
const device = require("express-device");
const helmet = require("helmet");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");
const ip = require("ip");
const morgan = require("morgan");
const session = require("express-session");
const passport = require("passport");
const cookieParser = require("cookie-parser");
// const redis = require("./configs/redis");
// const { RedisStore } = require("connect-redis");

// Add this //path
const messageConstants = require("./constants/message-constant");
const setupPath = require("./configs/setup");
const { Sequelize } = require("./models");
const logger = require("./configs/logger");
// const { apiRateLimiter } = require("./utils/loginRateLimit");

// const { apiRateLimiter } = require("./utils/loginRateLimit");

//websocket
const { initWebSocket } = require("./websocket");
const { sendNotification } = require("./helpers/send-notification");

const morganFormat = ":method :url :status :response-time ms";
const baseUrl = "";

const app = express();
const server = require("http").createServer(app);
app.use(
  "/resources",
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
  express.static(path.join(__dirname, "resources")),
);

const allowedOrigins = [
  "http://localhost:3000", // local dev
  "http://localhost:5171", // local dev
  "http://localhost:7001",
  "http://192.168.1.200:7001",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(helmet());
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  }),
);

app.set("trust proxy", 1);
app.use((req, res, next) => {
  // Get the relevant headers
  const userAgent = req.headers["user-agent"] || "";
  const acceptLanguage = req.headers["accept-language"] || "";
  const connection = req.headers["connection"] || "";
  const ip =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress || "";

  // Generate a fingerprint using SHA-256 (you can use other hash functions)
  const fingerprint = crypto
    .createHash("sha256")
    .update(userAgent + acceptLanguage + connection + ip)
    .digest("hex");

  // Attach the fingerprint to the request object
  req.deviceFingerprint = fingerprint;

  next();
});

app.use(device.capture());
app.use(cookieParser());

// stripe webhooks
app.use(
  "/api/v1/order/webhook",
  express.raw({ type: "application/json" }),
  require("./api/routes/order-route"),
);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: false,
  }),
);

// Redis session storage
app.use(
  session({
    secret: process.env.SESSION_SECRET || "nirvana", // Use env for security
    resave: false,
    saveUninitialized: false, // Only save authenticated sessions
    // cookie: {
    //   maxAge: 1 * 60 * 60 * 1000, // 1 day expiration
    //   httpOnly: true, // Prevent JS access
    //   secure: process.env.NODE_ENV === "production", // HTTPS in prod
    //   sameSite: "lax", // CSRF protection
    // },
  }),
);

app.use(passport.initialize());
app.use(passport.session());
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.get("/health", async (req, res) => {
  try {
    res.status(200).json({ status: "ok", message: "Backend is healthy" });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({ status: "error", message: "Backend is unhealthy" });
  }
});
app.use(baseUrl + "/api/v1", require("./api")); // -------- main api -----------

app.use("/setup/", setupPath);

//image serve for public
app.use("/public", express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

//error handler
app.use((err, req, res, next) => {
  const { message, title } =
    err instanceof Sequelize.ValidationError
      ? {
          message: err.errors?.[0]?.message || "Validation error occurred.",
          title: "Validation Error",
        }
      : {
          message: err.message || "An unknown error occurred.",
          title: err.title || messageConstants.EN.INTERNAL_SERVER_ERROR,
        };
  logger.error(message);

  res.status(err.status || 500).json({
    title,
    message,
    data: [],
  });
});

initWebSocket(server);

module.exports = { app, server };
