const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const tenantMiddleware = require("../middlewares/tenant-middleware");

const routesPath = path.join(__dirname, "routes");

// Resolve cafe (Host / X-Tenant-Slug) before any route hits POS tables
router.use(tenantMiddleware);

fs.readdirSync(routesPath).forEach((file) => {
  // Automatically load the route file if it's not in the manually handled list
  const filePath = path.join(routesPath, file);

  // Check if the file is a JavaScript file and should be loaded automatically
  if (file.endsWith("-route.js")) {
    const route = require(filePath);
    const routeName = `/${file.replace("-route.js", "")}`;
    router.use(routeName, route);
  }
});

router.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "api/v1 health check!",
  });
});

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
    status: 404,
  });
});

module.exports = router;
