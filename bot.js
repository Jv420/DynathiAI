require("dotenv").config();

const { createRuntime } = require("./src/core/runtime");
const { createMinecraftBot, startBackgroundLoops } = require("./src/core/botFactory");

const runtime = createRuntime();

createMinecraftBot(runtime);
startBackgroundLoops(runtime);

process.on("unhandledRejection", err => {
  console.error("Unhandled rejection:", err);
});

process.on("uncaughtException", err => {
  console.error("Uncaught exception:", err);
});
