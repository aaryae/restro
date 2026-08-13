"use strict";

require("dotenv").config();

const { ensureSeedUser } = require("../api/services/platform-service");

async function main() {
  const user = await ensureSeedUser();
  console.log("Platform admin ready:");
  console.log(`  id:       ${user.id}`);
  console.log(`  username: ${user.username}`);
  console.log(
    "  password: (from PLATFORM_ADMIN_PASSWORD — not printed)",
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
