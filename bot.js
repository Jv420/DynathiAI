require("dotenv").config();

const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const collectBlock = require("mineflayer-collectblock").plugin;
const { Vec3 } = require("vec3");
const axios = require("axios");
const { Client, GatewayIntentBits } = require("discord.js");

let bot;
let mcData;
let reconnecting = false;
let guardMode = false;
let workerMode = false;
let workerBusy = false;
let workerLoop = null;
let workerCycles = 0;

function sendWebhook(message) {
  if (!process.env.DISCORD_WEBHOOK_URL) return;
  axios.post(process.env.DISCORD_WEBHOOK_URL, { content: `🤖 **DynathiAI** | ${message}` }).catch(() => {});
}

function log(message) {
  console.log(message);
  sendWebhook(message);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isProtectedItem(item) {
  const name = item.name;
  return name.includes("pickaxe") || name.includes("axe") || name.includes("shovel") ||
    name.includes("sword") || name.includes("bow") || name.includes("crossbow") ||
    name.includes("helmet") || name.includes("chestplate") || name.includes("leggings") ||
    name.includes("boots") || name.includes("diamond") || name.includes("netherite") ||
    name.includes("emerald") || name.includes("elytra") || name.includes("trident") ||
    name.includes("shield") || name.includes("totem");
}

async function waitForWindow(timeoutMs = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (bot.currentWindow) return bot.currentWindow;
    await wait(200);
  }
  return null;
}

function createBot() {
  bot = mineflayer.createBot({
    host: process.env.BOT_HOST || "dynathiv2.duckdns.org",
    port: Number(process.env.BOT_PORT || 25565),
    username: process.env.BOT_USERNAME,
    version: process.env.BOT_VERSION || "1.21.11",
    auth: process.env.AUTH || "microsoft"
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(collectBlock);

  bot.once("spawn", () => {
    mcData = require("minecraft-data")(bot.version);
    const movements = new Movements(bot, mcData);
    movements.canDig = true;
    movements.allow1by1towers = true;
    movements.canOpenDoors = true;
    bot.pathfinder.setMovements(movements);
    bot.chat("🤖 DynathiAI is online!");
    log("✅ DynathiAI is verbonden met DynathiSMP.");
  });

  bot.on("chat", async (username, message) => {
    if (username === bot.username) return;
    if (!message.startsWith("bot ")) return;
    if (process.env.OWNER_NAME && username !== process.env.OWNER_NAME) return bot.chat("⛔ Alleen mijn eigenaar mag mij commands geven.");

    const args = message.split(" ");
    const command = args[1]?.toLowerCase();

    try {
      if (command === "help") bot.chat("Commands: follow, stop, mine, chop, build, inv, eat, guard, attack, sell, worker start/stop/status, spawn, home, sethome, bal");
      if (command === "follow" || command === "come" || command === "kom") actions.followOwner();
      if (command === "stop") actions.stopAll();
      if (command === "mine") await actions.mineBlock(args[2] || "dirt", Number(args[3] || 1));
      if (command === "chop") await actions.chopWood(Number(args[2] || 10));
      if (command === "build") await actions.buildBlock(args[2] || "dirt");
      if (command === "inv" || command === "inventory") bot.chat(actions.inventoryText().slice(0, 250));
      if (command === "eat") await actions.eatFood();
      if (command === "guard") bot.chat(actions.toggleGuard() ? "🛡️ Guard mode aan." : "🛡️ Guard mode uit.");
      if (command === "attack") actions.attackNearestMob();
      if (command === "sell") await actions.autoSell();
      if (command === "worker") {
        const subCommand = args[2]?.toLowerCase();
        if (subCommand === "start") actions.startWorker();
        else if (subCommand === "stop") actions.stopWorker();
        else if (subCommand === "status") bot.chat(actions.workerStatus());
        else bot.chat("Gebruik: bot worker start | bot worker stop | bot worker status");
      }
      if (command === "spawn") bot.chat("/spawn");
      if (command === "home") bot.chat(`/home ${args[2] || ""}`.trim());
      if (command === "sethome") bot.chat(`/sethome ${args[2] || "bot"}`);
      if (command === "bal" || command === "money") bot.chat("/balance");
    } catch (err) {
      bot.chat("❌ Fout: " + err.message);
      log("❌ Command fout: " + err.stack);
    }
  });

  bot.on("death", () => {
    log("💀 DynathiAI is dood gegaan.");
    setTimeout(() => { if (bot && bot.entity) bot.chat("/spawn"); }, 4000);
  });

  bot.on("kicked", reason => log("❌ Gekickt: " + reason));
  bot.on("error", err => log("❌ Error: " + err.message));
  bot.on("end", reconnect);
}

function reconnect() {
  if (reconnecting) return;
  reconnecting = true;
  workerBusy = false;
  log("🔴 Disconnected. Reconnect over 10 seconden.");
  setTimeout(() => { reconnecting = false; createBot(); }, 10000);
}

const actions = {
  followOwner() {
    const player = bot.players[process.env.OWNER_NAME]?.entity;
    if (!player) return bot.chat("Ik kan de eigenaar niet zien.");
    bot.chat("Ik volg je nu.");
    bot.pathfinder.setGoal(new goals.GoalFollow(player, 2), true);
  },

  stopAll() {
    guardMode = false;
    workerMode = false;
    workerBusy = false;
    if (workerLoop) clearInterval(workerLoop);
    workerLoop = null;
    bot.pathfinder.setGoal(null);
    bot.clearControlStates();
    bot.chat("✅ Gestopt.");
  },

  async mineBlock(blockName, amount) {
    if (!mcData) return bot.chat("Bot is nog niet klaar.");
    const blockType = mcData.blocksByName[blockName];
    if (!blockType) return bot.chat(`Dat block ken ik niet: ${blockName}`);

    const positions = bot.findBlocks({ matching: blockType.id, maxDistance: 64, count: amount });
    if (!positions.length) return bot.chat(`❌ Ik zie geen ${blockName} dichtbij.`);

    const blocks = positions.map(pos => bot.blockAt(pos)).filter(Boolean);
    const tool = bot.inventory.items().find(i => i.name.includes("pickaxe") || i.name.includes("shovel") || i.name.includes("axe"));
    if (tool) { try { await bot.equip(tool, "hand"); } catch {} }

    bot.chat(`⛏️ Ik ga ${blocks.length}x ${blockName} minen.`);
    try {
      await bot.collectBlock.collect(blocks);
      bot.chat("✅ Klaar met minen.");
    } catch (err) {
      bot.chat("❌ Minen mislukt: " + err.message);
      log("❌ Mining error: " + err.stack);
    }
  },

  async chopWood(amount) {
    if (!mcData) return bot.chat("Bot is nog niet klaar.");

    const logNames = ["oak_log", "birch_log", "spruce_log", "jungle_log", "acacia_log", "dark_oak_log", "mangrove_log", "cherry_log"];
    const ids = logNames.map(name => mcData.blocksByName[name]?.id).filter(Boolean);
    const positions = bot.findBlocks({ matching: ids, maxDistance: 64, count: amount });

    if (!positions.length) {
      bot.chat("❌ Ik zie geen hout dichtbij.");
      return false;
    }

    const axe = bot.inventory.items().find(i => i.name.includes("axe"));
    if (axe) { try { await bot.equip(axe, "hand"); } catch {} }

    bot.chat(`🪓 Ik ga ${positions.length} logs handmatig hakken.`);

    let chopped = 0;
    for (const pos of positions) {
      if (!bot || !bot.entity || !workerMode && false) break;
      const block = bot.blockAt(pos);
      if (!block || !logNames.includes(block.name)) continue;

      try {
        bot.pathfinder.setGoal(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 1));
        await wait(1700);
        const freshBlock = bot.blockAt(block.position);
        if (!freshBlock || !logNames.includes(freshBlock.name)) continue;
        await bot.lookAt(freshBlock.position.offset(0.5, 0.5, 0.5), true);
        await bot.dig(freshBlock);
        chopped++;
        await wait(300);
      } catch (err) {
        console.log("Manual chop error:", err.message);
      }
    }

    bot.pathfinder.setGoal(null);

    if (chopped > 0) {
      bot.chat(`✅ Klaar met hout hakken: ${chopped} logs.`);
      return true;
    }

    bot.chat("❌ Geen logs kunnen hakken.");
    return false;
  },

  async buildBlock(blockName) {
    const item = bot.inventory.items().find(i => i.name.includes(blockName));
    if (!item) return bot.chat(`Ik heb geen ${blockName}.`);
    try {
      await bot.equip(item, "hand");
      const pos = bot.entity.position.floored();
      const refBlock = bot.blockAt(pos.offset(1, -1, 0));
      if (!refBlock) return bot.chat("Geen goede plek om te bouwen.");
      await bot.placeBlock(refBlock, new Vec3(0, 1, 0));
      bot.chat(`✅ Ik heb ${blockName} geplaatst.`);
    } catch (err) {
      bot.chat("❌ Bouwen mislukt: " + err.message);
    }
  },

  inventoryText() {
    const items = bot.inventory.items();
    if (!items.length) return "Inventory is leeg.";
    return items.map(i => `${i.name} x${i.count}`).join(", ").slice(0, 1900);
  },

  async eatFood() {
    const food = bot.inventory.items().find(i => i.name.includes("bread") || i.name.includes("apple") || i.name.includes("beef") || i.name.includes("porkchop") || i.name.includes("chicken") || i.name.includes("carrot") || i.name.includes("potato"));
    if (!food) return bot.chat("Ik heb geen eten.");
    try {
      await bot.equip(food, "hand");
      await bot.consume();
      bot.chat("🍗 Ik heb gegeten.");
    } catch (err) {
      bot.chat("❌ Eten mislukt: " + err.message);
    }
  },

  attackNearestMob() {
    const mob = bot.nearestEntity(entity => entity.type === "mob" && entity.position.distanceTo(bot.entity.position) < 6);
    if (!mob) return bot.chat("Geen mob dichtbij.");
    bot.lookAt(mob.position.offset(0, 1, 0)).catch(() => {});
    bot.attack(mob);
    bot.chat("⚔️ Mob aangevallen.");
  },

  async autoSell() {
    const sellItemsBefore = bot.inventory.items().filter(item => !isProtectedItem(item));
    if (!sellItemsBefore.length) {
      bot.chat("💰 Geen verkoopbare items in inventory.");
      return false;
    }

    bot.chat(`/sell`);
    const window = await waitForWindow(7000);

    if (!window) {
      bot.chat("❌ Sell GUI niet geopend binnen 7 seconden.");
      return false;
    }

    bot.chat(`💰 AutoSell: ${sellItemsBefore.length} stacks gevonden. Items worden geplaatst...`);

    let moved = 0;
    let targetSlot = 0;

    for (const item of sellItemsBefore) {
      if (!bot.currentWindow) break;
      if (targetSlot >= Math.min(36, window.inventoryStart || 36)) break;

      try {
        const freshItem = bot.inventory.items().find(i => i.slot === item.slot && i.name === item.name);
        if (!freshItem) continue;
        await bot.moveSlotItem(freshItem.slot, targetSlot);
        moved++;
        targetSlot++;
        await wait(150);
      } catch (err) {
        console.log("AutoSell move error:", err.message);
      }
    }

    await wait(1000);

    if (bot.currentWindow) {
      bot.closeWindow(bot.currentWindow);
    }

    await wait(1500);

    if (moved > 0) {
      bot.chat(`💰 AutoSell voltooid: ${moved} stacks geplaatst en GUI gesloten.`);
      return true;
    }

    bot.chat("❌ AutoSell: geen items kunnen plaatsen.");
    return false;
  },

  async workerCycle() {
    if (!workerMode || workerBusy || !bot || !bot.entity) return;
    workerBusy = true;
    workerCycles++;

    try {
      bot.chat(`💼 Worker ronde ${workerCycles}: hout hakken gestart.`);
      const chopped = await actions.chopWood(20);
      if (!workerMode) return;
      if (chopped) {
        await wait(2000);
        await actions.autoSell();
        await wait(2000);
        bot.chat("/balance");
      } else {
        bot.chat("💼 Worker: geen hout gevonden/gehakt. Ik probeer straks opnieuw.");
      }
    } catch (err) {
      log("❌ Worker error: " + err.stack);
    } finally {
      workerBusy = false;
    }
  },

  startWorker() {
    if (workerMode) return bot.chat("💼 Worker mode staat al aan.");
    workerMode = true;
    workerBusy = false;
    bot.chat("💼 Worker mode gestart: ik hak hout, verkoop items en check balance.");
    log("💼 Worker mode gestart.");
    actions.workerCycle();
    workerLoop = setInterval(() => actions.workerCycle(), 90000);
  },

  stopWorker() {
    workerMode = false;
    workerBusy = false;
    if (workerLoop) clearInterval(workerLoop);
    workerLoop = null;
    if (bot && bot.entity) {
      bot.pathfinder.setGoal(null);
      bot.clearControlStates();
      bot.chat("💼 Worker mode gestopt.");
    }
    log("💼 Worker mode gestopt.");
  },

  workerStatus() {
    return workerMode ? `💼 Worker mode: AAN | Busy: ${workerBusy ? "ja" : "nee"} | Rondes: ${workerCycles}` : `💼 Worker mode: UIT | Rondes: ${workerCycles}`;
  },

  toggleGuard() {
    guardMode = !guardMode;
    return guardMode;
  }
};

function startDiscordController() {
  const discord = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
  discord.once("ready", () => log(`✅ Discord bot online als ${discord.user.tag}`));

  discord.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (process.env.DISCORD_CHANNEL_ID && message.channel.id !== process.env.DISCORD_CHANNEL_ID) return;
    if (!message.content.startsWith("!bot")) return;
    if (!bot || !bot.entity) return message.reply("❌ Minecraft bot is nog niet online.");

    const args = message.content.split(" ");
    const command = args[1]?.toLowerCase();

    try {
      if (command === "help") return message.reply("**DynathiAI commands**\n`!bot status`\n`!bot say <bericht>`\n`!bot follow`\n`!bot stop`\n`!bot mine <block> <aantal>`\n`!bot chop <aantal>`\n`!bot build <block>`\n`!bot inv`\n`!bot eat`\n`!bot guard`\n`!bot attack`\n`!bot sell`\n`!bot worker start`\n`!bot worker stop`\n`!bot worker status`\n`!bot spawn`");
      if (command === "status") {
        const p = bot.entity.position;
        return message.reply(`❤️ ${bot.health} | 🍗 ${bot.food} | X:${Math.floor(p.x)} Y:${Math.floor(p.y)} Z:${Math.floor(p.z)}`);
      }
      if (command === "say") { const text = args.slice(2).join(" "); if (!text) return message.reply("Gebruik: `!bot say <bericht>`"); bot.chat(text); return message.reply("✅ Bericht verzonden."); }
      if (command === "follow") { actions.followOwner(); return message.reply("✅ Volgen gestart"); }
      if (command === "stop") { actions.stopAll(); return message.reply("🛑 Gestopt"); }
      if (command === "mine") { await actions.mineBlock(args[2] || "dirt", Number(args[3] || 1)); return message.reply("⛏️ Mining gestart"); }
      if (command === "chop") { await actions.chopWood(Number(args[2] || 10)); return message.reply("🪓 Houthakken gestart"); }
      if (command === "build") { await actions.buildBlock(args[2] || "dirt"); return message.reply("🧱 Build uitgevoerd"); }
      if (command === "sell") { await actions.autoSell(); return message.reply("💰 AutoSell uitgevoerd"); }
      if (command === "eat") { await actions.eatFood(); return message.reply("🍗 Eten uitgevoerd"); }
      if (command === "attack") { actions.attackNearestMob(); return message.reply("⚔️ Attack uitgevoerd"); }
      if (command === "guard") return message.reply(actions.toggleGuard() ? "🛡️ Guard mode aan." : "🛡️ Guard mode uit.");
      if (command === "inv" || command === "inventory") return message.reply(actions.inventoryText());
      if (command === "spawn") { bot.chat("/spawn"); return message.reply("✅ /spawn uitgevoerd"); }
      if (command === "worker") {
        const subCommand = args[2]?.toLowerCase();
        if (subCommand === "start") { actions.startWorker(); return message.reply("💼 Worker mode gestart."); }
        if (subCommand === "stop") { actions.stopWorker(); return message.reply("🛑 Worker mode gestopt."); }
        if (subCommand === "status") return message.reply(actions.workerStatus());
        return message.reply("Gebruik: `!bot worker start`, `!bot worker stop` of `!bot worker status`");
      }
      return message.reply("Gebruik !bot help");
    } catch (err) {
      return message.reply("❌ Fout: " + err.message);
    }
  });

  if (process.env.DISCORD_TOKEN) discord.login(process.env.DISCORD_TOKEN);
  else log("⚠️ Geen DISCORD_TOKEN gevonden. Discord commands staan uit.");
}

setInterval(() => {
  if (!bot || !bot.entity) return;
  bot.setControlState("jump", true);
  setTimeout(() => bot.setControlState("jump", false), 400);
}, 60000);

setInterval(async () => {
  if (!bot || !bot.entity) return;
  if (bot.food < 14) await actions.eatFood().catch(() => {});
}, 15000);

setInterval(() => {
  if (!guardMode || !bot || !bot.entity) return;
  const mob = bot.nearestEntity(entity => entity.type === "mob" && entity.position.distanceTo(bot.entity.position) < 5);
  if (!mob) return;
  bot.lookAt(mob.position.offset(0, 1, 0)).catch(() => {});
  bot.attack(mob);
}, 2000);

createBot();
startDiscordController();
