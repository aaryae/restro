const { execSync } = require("child_process");
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const path = require("path");

const appRoot = path.resolve(__dirname, "..");

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a || ""), "utf8");
  const right = Buffer.from(String(b || ""), "utf8");
  if (left.length !== right.length) {
    // Compare equal-length buffers to keep runtime roughly constant.
    crypto.timingSafeEqual(left, left);
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

router.post("/webhook", (req, res) => {
  try {
    const secret = String(process.env.WEBHOOK_SECRET || "").trim();
    if (!secret || secret.length < 16) {
      return res.status(503).send("Deploy webhook is not configured");
    }
    if (process.env.ALLOW_DEPLOY_WEBHOOK !== "true") {
      return res.status(404).send("Not Found");
    }

    const signature = req.headers["x-hub-signature-256"];
    const payload = req.body;
    if (!Buffer.isBuffer(payload)) {
      return res.status(400).send("Webhook requires raw JSON body");
    }

    const expected =
      "sha256=" +
      crypto.createHmac("sha256", secret).update(payload).digest("hex");

    if (!timingSafeEqualString(signature, expected)) {
      return res.status(401).send("Unauthorized");
    }

    // Only pull; never interpolate untrusted input into the shell.
    execSync("git pull origin development", {
      cwd: appRoot,
      stdio: "ignore",
    });
    execSync("touch backend/tmp/restart.txt", {
      cwd: appRoot,
      stdio: "ignore",
    });
    console.log("Deployed successfully!");
    return res.send("Deployed!");
  } catch (err) {
    console.error("Deploy error:", err.message);
    return res.status(500).send("Deploy failed");
  }
});

module.exports = router;
