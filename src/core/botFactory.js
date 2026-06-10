const mineflayer = require("mineflayer");
const { pathfinder, Movements } = require("mineflayer-pathfinder");
const collectBlock = require("mineflayer-collectblock").plugin;
const minecraftData = require("minecraft-data");
const { handleCommand } = require("./commandHandler");

function installChatThrottle(bot, runtime) {
  const originalChat = bot.chat.bind(bot);
  const queue = [];
  let sending = false;
  let lastMessage = "";
  let lastMessageAt = 0;
  const delayMs = Number(process.env.CHAT_THROTTLE_MS) || 3000;
  const maxQueue = Number(process.env.CHAT_QUEUE_MAX) || 20;

  async function pump() {
    if (sending) return;
    sending = true;

    while (queue.length && bot.entity) {
      const message = queue.shift();
      try {
        originalChat(message.slice(0, 240));
      } catch (err) {
        if (runtime?.logger) runtime.logger.log(`❌ Chat throttle error: ${err.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    sending = false;
  }

  bot.chat = message => {
    const text = String(message || "").trim();
    if (!text) return false;

    const now = Date.now();
    if (text === lastMessage && now - lastMessageAt < 15000) return false;
    lastMessage = text;
    lastMessageAt = now;

    if (queue.length >= maxQueue) queue.shift();
    queue.push(text);
    pump().catch(() => {});
    return true;
  };

  bot.chatNow = originalChat;
}

function createMinecraftBot(runtime) {
  const bot = mineflayer.createBot({
    host: process.env.BOT_HOST || "dynathiv2.duckdns.org",
    port: Number(process.env.BOT_PORT) || 25565,
    username: process.env.BOT_USERNAME,
    auth: process.env.AUTH || "microsoft",
    version: process.env.BOT_VERSION || "1.21.11"
  });

  installChatThrottle(bot, runtime);

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(collectBlock);

  runtime.setBot(bot);

  bot.once("spawn", () => {
    const mcData = minecraftData(bot.version);
    runtime.setMcData(mcData);

    const movements = new Movements(bot, mcData);
    bot.pathfinder.setMovements(movements);

    runtime.logger.log("✅ DynathiAI Pro Core is online.");
    bot.chat("🤖 DynathiAI Pro Core online. Gebruik: bot help");
  });

  bot.on("chat", async (username, message) => {
    if (username === bot.username) return;
    if (!message.toLowerCase().startsWith("bot ")) return;

    const owner = process.env.OWNER_NAME;
    if (owner && username !== owner) {
      bot.chat("❌ Alleen mijn owner mag commands gebruiken.");
      return;
    }

    const args = message.slice(4).trim().split(/\s+/);

    await handleCommand({
      bot,
      mcData: runtime.getMcData(),
      args,
      modules: runtime.modules,
      jobManager: runtime.jobManager,
      brain: runtime.brain,
      autonomous: runtime.autonomous,
      villageBuilder: runtime.villageBuilder,
      smartBrain: runtime.smartBrain,
      reply: text => bot.chat(String(text))
    });
  });

  bot.on("death", () => {
    runtime.logger.log("💀 DynathiAI is dood gegaan.");
    setTimeout(() => {
      if (runtime.getBot()) runtime.getBot().chat("/spawn");
    }, 4000);
  });

  bot.on("kicked", reason => runtime.logger.log(`🚪 Bot kicked: ${reason}`));
  bot.on("error", err => runtime.logger.log(`❌ Bot error: ${err.message}`));

  bot.on("end", () => {
    runtime.logger.log("🔌 Bot disconnected. Reconnect over 10 seconden...");
    runtime.setBot(null);
    setTimeout(() => createMinecraftBot(runtime), 10000);
  });

  return bot;
}

function startBackgroundLoops(runtime) {
  setInterval(() => {
    const bot = runtime.getBot();
    if (!bot || !bot.entity) return;
    runtime.modules.survival.autoEat(bot).catch(() => {});
  }, 15000);

  setInterval(() => {
    const bot = runtime.getBot();
    if (!bot || !bot.entity) return;
    runtime.modules.survival.antiAfkJump(bot).catch(() => {});
  }, 120000);
}

module.exports = {
  createMinecraftBot,
  startBackgroundLoops
};
