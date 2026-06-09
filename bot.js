require("dotenv").config();

const { createRuntime } = require("./src/core/runtime");
const { createMinecraftBot, startBackgroundLoops } = require("./src/core/botFactory");
const { startDiscordController } = require("./src/core/discordFactory");

const runtime = createRuntime();

console.log("🤖 DynathiAI Pro Core wordt gestart...");
console.log(`🌐 Server: ${process.env.BOT_HOST || "dynathiv2.duckdns.org"}:${process.env.BOT_PORT || 25565}`);
console.log(`👤 Bot username: ${process.env.BOT_USERNAME || "NIET_INGESTELD"}`);

createMinecraftBot(runtime);
startBackgroundLoops(runtime);
startDiscordController(runtime);

process.on("unhandledRejection", err => {
  console.error("Unhandled rejection:", err);
});

process.on("uncaughtException", err => {
  console.error("Uncaught exception:", err);
});
