// src/index.js
import "dotenv/config";
import app from "./app.js";
import { sequelize } from "./config/db.js";

const PORT = Number(process.env.PORT || 8087);

async function start() {
  try {
    // connect once
    await sequelize.authenticate();
    console.log("[boot] database connected");

    // sync once (avoid double-sync)
    await sequelize.sync({ alter: true });
    console.log("[boot] models synced");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[boot] user-service listening on ${PORT}`);
    });
  } catch (err) {
    console.error("[boot] failed to start:", err);
    process.exit(1);
  }
}

// helpful for catching async mistakes in prod/CI
process.on("unhandledRejection", (r) => {
  console.error("[unhandledRejection]", r);
});
process.on("uncaughtException", (e) => {
  console.error("[uncaughtException]", e);
  process.exit(1);
});

start();

