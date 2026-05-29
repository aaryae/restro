require("dotenv").config({ path: ".env" });
const { app, server } = require("./app");
const port = process.env.PORT || 8000;
const env = process.env.ENV || "Development";
const appName = process.env.APP_NAME || "General Asahi Admin";

app.set("PORT_NUMBER", port);

server.listen(port, "0.0.0.0", () => {
  const date = new Date();
  console.log("|--------------------------------------------");
  console.log("| Server       : " + appName);
  console.log("| Environment  : " + env);
  console.log("| Port         : " + port);
  console.log("| Date         : " + date.toJSON().split("T").join(" "));
  console.log("|--------------------------------------------");
});

process.on("SIGTERM", () => {
  server.close(() => {
    process.exit(0);
  });
});

// second test deploy