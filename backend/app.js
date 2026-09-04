"use strict";
require("dotenv").config();
require("./utils/media/deleteMediaTimer");
require("./helpers/order/cleanup-expired-carts");
require("./helpers/oauth/google-oauth-helper");
require("./helpers/oauth/facebook-oauth-helper");
require("./helpers/oauth/local-oauth-helper");
require("./helpers/passport-helper");
require("./helpers/oauth/apple-oauth-helper");
require("./jobs/expire-trials").expireTrialsJob.start();

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
const { apiRateLimiter } = require("./utils/loginRateLimit");

//path
const messageConstants = require("./constants/message-constant");
const setupPath = require("./configs/setup");
const { Sequelize } = require("./models");
const logger = require("./configs/logger");

//websocket
const { initWebSocket } = require("./websocket");
const { sendNotification } = require("./helpers/send-notification");

const morganFormat = ":method :url :status :response-time ms";
const baseUrl = "";

const app = express();
const server = require("http").createServer(app);

const { isTenantBaseOrigin } = require("./lib/pos-public-url");

const allowedOrigins = [
  "http://localhost:3000", // serve marketing site
  "http://localhost:5171",
  "http://localhost:7001",
  "http://localhost:7002", // platform superadmin
  "http://192.168.1.200:7001",
  "http://192.168.1.200:7002",
];

function isPrivateLanHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^192\.168\.\d+\.\d+$/.test(hostname) ||
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)
  );
}

function isAllowedOrigin(origin) {
  // Credentialed CORS must not reflect a missing/null Origin in production.
  if (!origin) {
    return process.env.NODE_ENV === "development";
  }
  if (allowedOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV === "development") return true;
  if (isTenantBaseOrigin(origin)) return true;
  const extra = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (extra.includes(origin)) return true;
  try {
    // LAN hosts only in development — never in production.
    if (process.env.NODE_ENV === "development") {
      return isPrivateLanHost(new URL(origin).hostname);
    }
    return false;
  } catch {
    return false;
  }
}

// Media files: allow missing Origin (CDN revalidation, <img>, curl) and never
// throw from CORS — a thrown error becomes 500 and Cloudflare caches failures.
app.use(
  "/resources",
  cors({
    origin: function (origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: false,
    methods: ["GET", "HEAD", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
  express.static(path.join(__dirname, "resources"), {
    setHeaders(res) {
      // POS loads images cross-origin from serveapi.* — allow embedding.
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      // Prefer short TTL so a bad edge cache (e.g. old 404) expires quickly.
      res.setHeader(
        "Cache-Control",
        "public, max-age=300, stale-while-revalidate=60",
      );
    },
  }),
);

app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
// Legacy wide-open CORS (disabled):
// app.use(cors({ origin: "*" }));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
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
  const userAgent = req.headers["user-agent"] || "";
  const acceptLanguage = req.headers["accept-language"] || "";
  const connection = req.headers["connection"] || "";
  // Prefer Express trust-proxy IP — never trust raw XFF alone for rate limits.
  const clientIp = req.ip || req.socket?.remoteAddress || "";

  const fingerprint = crypto
    .createHash("sha256")
    .update(userAgent + acceptLanguage + connection + clientIp)
    .digest("hex");

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

// GitHub deploy webhook (raw body required for signature verification)
app.use(
  "/deploy",
  express.raw({ type: "application/json" }),
  require("./deploy"),
);

app.use(bodyParser.json({ limit: "2mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "2mb",
    extended: false,
  }),
);

function resolveSessionSecret() {
  const fromEnv = String(process.env.SESSION_SECRET || "").trim();
  const isProd =
    process.env.NODE_ENV === "production" || process.env.ENV === "production";
  if (fromEnv.length >= 32) return fromEnv;
  if (isProd) {
    throw new Error(
      "SESSION_SECRET is missing or too short (min 32 chars). Set it in backend/.env",
    );
  }
  // Local-only fallback so Passport sessions work without extra setup.
  return fromEnv || "nirvana-dev-only-session-secret-change-me!!";
}

app.use(
  session({
    secret: resolveSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.HTTP_SECURE === "true" ||
        process.env.NODE_ENV === "production",
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());
// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });
app.get("/health", async (req, res) => {
  try {
    res.status(200).json({ status: "ok", message: "Backend is healthy" });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({ status: "error", message: "Backend is unhealthy" });
  }
});
app.use(baseUrl + "/api/v1", apiRateLimiter);
app.use(baseUrl + "/api/v1", require("./api")); // -------- main api -----------

app.use("/setup/", (req, res, next) => {
  const allowSetupRoute = process.env.ALLOW_SETUP_ROUTE === "true";
  const isLocalhost =
    req.ip === "127.0.0.1" || req.ip === "::1" || req.ip === "::ffff:127.0.0.1";
  if (allowSetupRoute && process.env.NODE_ENV === "development" && isLocalhost) {
    return next();
  }
  return res.status(404).json({
    success: false,
    status: 404,
    message: "Not Found",
  });
});
app.use("/setup/", setupPath);

//image serve for public
app.use("/public", express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  // Unmatched API routes should not fall through to the admin SPA shell.
  if (req.path.startsWith("/api/")) {
    return next();
  }
  if (/(.ico|.js|.css|.jpg|.svg|.png|.map)$/i.test(req.path)) {
    next();
  } else {
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
    res.sendFile(path.join(__dirname, "../admin/web", "index.html"));
  }
});

app.use("/", express.static(path.join(__dirname, "../admin/web")));

app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

//error handler
app.use((err, req, res, next) => {
  const isProd =
    process.env.NODE_ENV === "production" || process.env.ENV === "production";
  const { message, title } =
    err instanceof Sequelize.ValidationError
      ? {
          message: err.errors?.[0]?.message || "Validation error occurred.",
          title: "Validation Error",
        }
      : {
          message: isProd
            ? "An unexpected error occurred."
            : err.message || "An unknown error occurred.",
          title: err.title || messageConstants.EN.INTERNAL_SERVER_ERROR,
        };
  logger.error(err.message || message);

  res.status(err.status || 500).json({
    title,
    message,
    data: [],
  });
});

initWebSocket(server);

const { bootstrapMachbankEmerchant } = require("./integrations/machbank-emerchant/bootstrap");
bootstrapMachbankEmerchant().catch((err) => {
  logger.error(`Machbank bootstrap failed: ${err.message}`);
});

module.exports = { app, server };
