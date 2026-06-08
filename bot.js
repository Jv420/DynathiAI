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
let jobMode = false;
let jobType = "none";
let jobTarget = "none";
let jobLoop = null;
let jobBusy = false;
let jobCycles = 0;

function sendWebhook(message) {
  if (!process.env.DISCORD_WEBHOOK_URL) return;
  axios.post(process.env.DISCORD_WEBHOOK_URL, { content: `🤖 **DynathiAI** | ${message}` }).catch(() => {});
}

function log(message) { console.log(message); sendWebhook(message); }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function isProtectedItem(item) {
  const name = item.name;
  return name.includes("pickaxe") || name.includes("axe") || name.includes("shovel") || name.includes("sword") ||
    name.includes("bow") || name.includes("crossbow") || name.includes("helmet") || name.includes("chestplate") ||
    name.includes("leggings") || name.includes("boots") || name.includes("diamond") || name.includes("netherite") ||
    name.includes("emerald") || name.includes("elytra") || name.includes("trident") || name.includes("shield") ||
    name.includes("totem") || name.includes("fishing_rod");
}

async function waitForWindow(timeoutMs = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (bot.currentWindow) return bot.currentWindow;
    await wait(200);
  }
  return null;
}

function findNearestContainer(names) {
  const blocks = bot.findBlocks({
    matching: block => block && names.includes(block.name),
    maxDistance: 5,
    count: 10
  });
  if (!blocks.length) return null;
  const sorted = blocks.map(pos => bot.blockAt(pos)).filter(Boolean).sort((a, b) =>
    a.position.distanceTo(bot.entity.position) - b.position.distanceTo(bot.entity.position)
  );
  return sorted[0] || null;
}

async function openNearestContainer(names) {
  const block = findNearestContainer(names);
  if (!block) return null;
  try {
    bot.pathfinder.setGoal(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 2));
    await wait(1000);
    return await bot.openContainer(block);
  } catch (err) {
    console.log("Open container error:", err.message);
    return null;
  }
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
    const sub = args[2]?.toLowerCase();

    try {
      if (command === "help") bot.chat("Commands: follow, stop, mine, chop, fish, job, chest, shulker, build, inv, eat, guard, attack, sell, worker, spawn, home, sethome, bal");
      if (command === "follow" || command === "come" || command === "kom") actions.followOwner();
      if (command === "stop") actions.stopAll();
      if (command === "mine") await actions.mineBlock(args[2] || "dirt", Number(args[3] || 1));
      if (command === "chop") await actions.chopWood(Number(args[2] || 10));
      if (command === "fish") await actions.fishOnce();
      if (command === "build") await actions.buildBlock(args[2] || "dirt");
      if (command === "inv" || command === "inventory") bot.chat(actions.inventoryText().slice(0, 250));
      if (command === "eat") await actions.eatFood();
      if (command === "guard") bot.chat(actions.toggleGuard() ? "🛡️ Guard mode aan." : "🛡️ Guard mode uit.");
      if (command === "attack") actions.attackNearestMob();
      if (command === "sell") await actions.autoSell();
      if (command === "worker") {
        if (sub === "start") actions.startWorker();
        else if (sub === "stop") actions.stopWorker();
        else if (sub === "status") bot.chat(actions.workerStatus());
        else bot.chat("Gebruik: bot worker start | stop | status");
      }
      if (command === "job") {
        if (sub === "wood") actions.startJob("wood", "logs");
        else if (sub === "fish") actions.startJob("fish", "fish");
        else if (sub === "mine") actions.startJob("mine", args[3] || "stone");
        else if (sub === "stop") actions.stopJob();
        else if (sub === "status") bot.chat(actions.jobStatus());
        else bot.chat("Gebruik: bot job wood | fish | mine stone | stop | status");
      }
      if (command === "chest") {
        if (sub === "store") await actions.containerStore(["chest", "trapped_chest"], "Chest");
        else if (sub === "dump") await actions.containerDump(["chest", "trapped_chest"], "Chest");
        else if (sub === "take") await actions.containerTake(["chest", "trapped_chest"], "Chest", args[3], Number(args[4] || 64));
        else bot.chat("Gebruik: bot chest store | dump | take <item> <aantal>");
      }
      if (command === "shulker") {
        const shulkerNames = Object.keys(mcData.blocksByName).filter(n => n.includes("shulker_box"));
        if (sub === "store") await actions.containerStore(shulkerNames, "Shulker");
        else if (sub === "dump") await actions.containerDump(shulkerNames, "Shulker");
        else bot.chat("Gebruik: bot shulker store | dump");
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

  bot.on("death", () => { log("💀 DynathiAI is dood gegaan."); setTimeout(() => { if (bot && bot.entity) bot.chat("/spawn"); }, 4000); });
  bot.on("kicked", reason => log("❌ Gekickt: " + reason));
  bot.on("error", err => log("❌ Error: " + err.message));
  bot.on("end", reconnect);
}

function reconnect() {
  if (reconnecting) return;
  reconnecting = true;
  workerBusy = false;
  jobBusy = false;
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
    actions.stopWorker(false);
    actions.stopJob(false);
    bot.pathfinder.setGoal(null);
    bot.clearControlStates();
    bot.chat("✅ Alles gestopt.");
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
    try { await bot.collectBlock.collect(blocks); bot.chat("✅ Klaar met minen."); return true; }
    catch (err) { bot.chat("❌ Minen mislukt: " + err.message); log("❌ Mining error: " + err.stack); return false; }
  },

  async chopWood(amount) {
    if (!mcData) return bot.chat("Bot is nog niet klaar.");
    const logNames = ["oak_log", "birch_log", "spruce_log", "jungle_log", "acacia_log", "dark_oak_log", "mangrove_log", "cherry_log"];
    const ids = logNames.map(name => mcData.blocksByName[name]?.id).filter(Boolean);
    const positions = bot.findBlocks({ matching: ids, maxDistance: 64, count: amount });
    if (!positions.length) { bot.chat("❌ Ik zie geen hout dichtbij."); return false; }
    const axe = bot.inventory.items().find(i => i.name.includes("axe"));
    if (axe) { try { await bot.equip(axe, "hand"); } catch {} }
    bot.chat(`🪓 Ik ga ${positions.length} logs handmatig hakken.`);
    let chopped = 0;
    for (const pos of positions) {
      if (!bot || !bot.entity) break;
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
      } catch (err) { console.log("Manual chop error:", err.message); }
    }
    bot.pathfinder.setGoal(null);
    if (chopped > 0) { bot.chat(`✅ Klaar met hout hakken: ${chopped} logs.`); return true; }
    bot.chat("❌ Geen logs kunnen hakken."); return false;
  },

  async fishOnce() {
    const rod = bot.inventory.items().find(i => i.name.includes("fishing_rod"));
    if (!rod) { bot.chat("🎣 Ik heb geen fishing rod."); return false; }
    try {
      await bot.equip(rod, "hand");
      bot.chat("🎣 Ik ga vissen...");
      await bot.fish();
      bot.chat("🐟 Beet gehad / visactie klaar.");
      return true;
    } catch (err) { bot.chat("❌ Vissen mislukt: " + err.message); return false; }
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
    } catch (err) { bot.chat("❌ Bouwen mislukt: " + err.message); }
  },

  inventoryText() {
    const items = bot.inventory.items();
    if (!items.length) return "Inventory is leeg.";
    return items.map(i => `${i.name} x${i.count}`).join(", ").slice(0, 1900);
  },

  async eatFood() {
    const food = bot.inventory.items().find(i => i.name.includes("bread") || i.name.includes("apple") || i.name.includes("beef") || i.name.includes("porkchop") || i.name.includes("chicken") || i.name.includes("carrot") || i.name.includes("potato"));
    if (!food) return bot.chat("Ik heb geen eten.");
    try { await bot.equip(food, "hand"); await bot.consume(); bot.chat("🍗 Ik heb gegeten."); }
    catch (err) { bot.chat("❌ Eten mislukt: " + err.message); }
  },

  attackNearestMob() {
    const mob = bot.nearestEntity(entity => entity.type === "mob" && entity.position.distanceTo(bot.entity.position) < 6);
    if (!mob) return bot.chat("Geen mob dichtbij.");
    bot.lookAt(mob.position.offset(0, 1, 0)).catch(() => {});
    bot.attack(mob); bot.chat("⚔️ Mob aangevallen.");
  },

  async autoSell() {
    const sellItemsBefore = bot.inventory.items().filter(item => !isProtectedItem(item));
    if (!sellItemsBefore.length) { bot.chat("💰 Geen verkoopbare items in inventory."); return false; }
    bot.chat(`/sell`);
    const window = await waitForWindow(7000);
    if (!window) { bot.chat("❌ Sell GUI niet geopend binnen 7 seconden."); return false; }
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
        moved++; targetSlot++; await wait(150);
      } catch (err) { console.log("AutoSell move error:", err.message); }
    }
    await wait(1000);
    if (bot.currentWindow) bot.closeWindow(bot.currentWindow);
    await wait(1500);
    if (moved > 0) { bot.chat(`💰 AutoSell voltooid: ${moved} stacks geplaatst en GUI gesloten.`); return true; }
    bot.chat("❌ AutoSell: geen items kunnen plaatsen."); return false;
  },

  async containerStore(names, label) {
    const container = await openNearestContainer(names);
    if (!container) { bot.chat(`❌ Geen ${label} dichtbij gevonden.`); return false; }
    const items = bot.inventory.items().filter(item => !isProtectedItem(item));
    let moved = 0;
    for (const item of items) {
      try { await container.deposit(item.type, null, item.count); moved++; await wait(100); }
      catch (err) { console.log(`${label} store error:`, err.message); }
    }
    container.close();
    bot.chat(`📦 ${label} store klaar: ${moved} stacks opgeslagen.`);
    return moved > 0;
  },

  async containerDump(names, label) {
    const container = await openNearestContainer(names);
    if (!container) { bot.chat(`❌ Geen ${label} dichtbij gevonden.`); return false; }
    const items = container.containerItems();
    let moved = 0;
    for (const item of items) {
      try { await container.withdraw(item.type, null, item.count); moved++; await wait(100); }
      catch (err) { console.log(`${label} dump error:`, err.message); }
    }
    container.close();
    bot.chat(`📦 ${label} dump klaar: ${moved} stacks gepakt.`);
    return moved > 0;
  },

  async containerTake(names, label, itemName, count) {
    if (!itemName) { bot.chat(`Gebruik: take <item> <aantal>`); return false; }
    const container = await openNearestContainer(names);
    if (!container) { bot.chat(`❌ Geen ${label} dichtbij gevonden.`); return false; }
    const item = container.containerItems().find(i => i.name.includes(itemName));
    if (!item) { container.close(); bot.chat(`❌ ${itemName} niet gevonden in ${label}.`); return false; }
    const takeCount = Math.min(count || 64, item.count);
    try { await container.withdraw(item.type, null, takeCount); container.close(); bot.chat(`📦 ${takeCount}x ${item.name} uit ${label} gepakt.`); return true; }
    catch (err) { container.close(); bot.chat(`❌ Take mislukt: ${err.message}`); return false; }
  },

  async jobCycle() {
    if (!jobMode || jobBusy || !bot || !bot.entity) return;
    jobBusy = true; jobCycles++;
    try {
      if (jobType === "wood") { bot.chat(`🌲 Job wood ronde ${jobCycles}`); await actions.chopWood(20); await wait(1500); await actions.autoSell(); }
      if (jobType === "mine") { bot.chat(`⛏️ Job mine ronde ${jobCycles}: ${jobTarget}`); await actions.mineBlock(jobTarget, 20); await wait(1500); await actions.autoSell(); }
      if (jobType === "fish") { bot.chat(`🎣 Job fish ronde ${jobCycles}`); await actions.fishOnce(); await wait(1000); }
      if (jobMode && (jobType === "wood" || jobType === "mine")) bot.chat("/balance");
    } catch (err) { log("❌ Job error: " + err.stack); }
    finally { jobBusy = false; }
  },

  startJob(type, target) {
    if (jobMode) return bot.chat("📊 Er draait al een job. Gebruik eerst: bot job stop");
    actions.stopWorker(false);
    jobMode = true; jobType = type; jobTarget = target || "none"; jobBusy = false;
    bot.chat(`📊 Job gestart: ${jobType}${jobType === "mine" ? " " + jobTarget : ""}`);
    log(`📊 Job gestart: ${jobType} ${jobTarget}`);
    actions.jobCycle();
    jobLoop = setInterval(() => actions.jobCycle(), type === "fish" ? 15000 : 90000);
  },

  stopJob(showChat = true) {
    jobMode = false; jobBusy = false; jobType = "none"; jobTarget = "none";
    if (jobLoop) clearInterval(jobLoop); jobLoop = null;
    if (bot && bot.entity) { bot.pathfinder.setGoal(null); bot.clearControlStates(); }
    if (showChat && bot && bot.entity) bot.chat("📊 Job gestopt.");
  },

  jobStatus() {
    return jobMode ? `📊 Job: AAN | Type: ${jobType} | Target: ${jobTarget} | Busy: ${jobBusy ? "ja" : "nee"} | Rondes: ${jobCycles}` : `📊 Job: UIT | Rondes: ${jobCycles}`;
  },

  async workerCycle() {
    if (!workerMode || workerBusy || !bot || !bot.entity) return;
    workerBusy = true; workerCycles++;
    try {
      bot.chat(`💼 Worker ronde ${workerCycles}: hout hakken gestart.`);
      const chopped = await actions.chopWood(20);
      if (!workerMode) return;
      if (chopped) { await wait(2000); await actions.autoSell(); await wait(2000); bot.chat("/balance"); }
      else bot.chat("💼 Worker: geen hout gevonden/gehakt. Ik probeer straks opnieuw.");
    } catch (err) { log("❌ Worker error: " + err.stack); }
    finally { workerBusy = false; }
  },

  startWorker() {
    if (workerMode) return bot.chat("💼 Worker mode staat al aan.");
    actions.stopJob(false);
    workerMode = true; workerBusy = false;
    bot.chat("💼 Worker mode gestart: ik hak hout, verkoop items en check balance."); log("💼 Worker mode gestart.");
    actions.workerCycle(); workerLoop = setInterval(() => actions.workerCycle(), 90000);
  },

  stopWorker(showChat = true) {
    workerMode = false; workerBusy = false;
    if (workerLoop) clearInterval(workerLoop); workerLoop = null;
    if (bot && bot.entity) { bot.pathfinder.setGoal(null); bot.clearControlStates(); if (showChat) bot.chat("💼 Worker mode gestopt."); }
    if (showChat) log("💼 Worker mode gestopt.");
  },

  workerStatus() { return workerMode ? `💼 Worker mode: AAN | Busy: ${workerBusy ? "ja" : "nee"} | Rondes: ${workerCycles}` : `💼 Worker mode: UIT | Rondes: ${workerCycles}`; },
  toggleGuard() { guardMode = !guardMode; return guardMode; }
};

async function handleDiscordCommand(message) {
  const args = message.content.split(" ");
  const command = args[1]?.toLowerCase();
  const sub = args[2]?.toLowerCase();
  if (!bot || !bot.entity) return message.reply("❌ Minecraft bot is nog niet online.");
  try {
    if (command === "help") return message.reply("**DynathiAI commands**\n`!bot status` `!bot say <bericht>` `!bot follow` `!bot stop`\n`!bot mine <block> <aantal>` `!bot chop <aantal>` `!bot fish`\n`!bot job wood` `!bot job fish` `!bot job mine stone` `!bot job stop` `!bot job status`\n`!bot chest store` `!bot chest dump` `!bot chest take oak_log 64`\n`!bot shulker store` `!bot shulker dump`\n`!bot sell` `!bot inv` `!bot guard` `!bot worker start`");
    if (command === "status") { const p = bot.entity.position; return message.reply(`❤️ ${bot.health} | 🍗 ${bot.food} | X:${Math.floor(p.x)} Y:${Math.floor(p.y)} Z:${Math.floor(p.z)}`); }
    if (command === "say") { const text = args.slice(2).join(" "); if (!text) return message.reply("Gebruik: `!bot say <bericht>`"); bot.chat(text); return message.reply("✅ Bericht verzonden."); }
    if (command === "follow") { actions.followOwner(); return message.reply("✅ Volgen gestart"); }
    if (command === "stop") { actions.stopAll(); return message.reply("🛑 Alles gestopt"); }
    if (command === "mine") { await actions.mineBlock(args[2] || "dirt", Number(args[3] || 1)); return message.reply("⛏️ Mining uitgevoerd"); }
    if (command === "chop") { await actions.chopWood(Number(args[2] || 10)); return message.reply("🪓 Houthakken uitgevoerd"); }
    if (command === "fish") { await actions.fishOnce(); return message.reply("🎣 Vissen uitgevoerd"); }
    if (command === "sell") { await actions.autoSell(); return message.reply("💰 AutoSell uitgevoerd"); }
    if (command === "inv" || command === "inventory") return message.reply(actions.inventoryText());
    if (command === "guard") return message.reply(actions.toggleGuard() ? "🛡️ Guard mode aan." : "🛡️ Guard mode uit.");
    if (command === "worker") { if (sub === "start") { actions.startWorker(); return message.reply("💼 Worker gestart"); } if (sub === "stop") { actions.stopWorker(); return message.reply("💼 Worker gestopt"); } if (sub === "status") return message.reply(actions.workerStatus()); }
    if (command === "job") { if (sub === "wood") { actions.startJob("wood", "logs"); return message.reply("🌲 Job wood gestart"); } if (sub === "fish") { actions.startJob("fish", "fish"); return message.reply("🎣 Job fish gestart"); } if (sub === "mine") { actions.startJob("mine", args[3] || "stone"); return message.reply(`⛏️ Job mine ${args[3] || "stone"} gestart`); } if (sub === "stop") { actions.stopJob(); return message.reply("📊 Job gestopt"); } if (sub === "status") return message.reply(actions.jobStatus()); }
    if (command === "chest") { if (sub === "store") { await actions.containerStore(["chest", "trapped_chest"], "Chest"); return message.reply("📦 Chest store uitgevoerd"); } if (sub === "dump") { await actions.containerDump(["chest", "trapped_chest"], "Chest"); return message.reply("📦 Chest dump uitgevoerd"); } if (sub === "take") { await actions.containerTake(["chest", "trapped_chest"], "Chest", args[3], Number(args[4] || 64)); return message.reply("📦 Chest take uitgevoerd"); } }
    if (command === "shulker") { const shulkerNames = Object.keys(mcData.blocksByName).filter(n => n.includes("shulker_box")); if (sub === "store") { await actions.containerStore(shulkerNames, "Shulker"); return message.reply("🟪 Shulker store uitgevoerd"); } if (sub === "dump") { await actions.containerDump(shulkerNames, "Shulker"); return message.reply("🟪 Shulker dump uitgevoerd"); } }
    if (command === "eat") { await actions.eatFood(); return message.reply("🍗 Eten uitgevoerd"); }
    if (command === "attack") { actions.attackNearestMob(); return message.reply("⚔️ Attack uitgevoerd"); }
    if (command === "spawn") { bot.chat("/spawn"); return message.reply("✅ /spawn uitgevoerd"); }
    return message.reply("Gebruik `!bot help`");
  } catch (err) { return message.reply("❌ Fout: " + err.message); }
}

function startDiscordController() {
  const discord = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
  discord.once("ready", () => log(`✅ Discord bot online als ${discord.user.tag}`));
  discord.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (process.env.DISCORD_CHANNEL_ID && message.channel.id !== process.env.DISCORD_CHANNEL_ID) return;
    if (!message.content.startsWith("!bot")) return;
    await handleDiscordCommand(message);
  });
  if (process.env.DISCORD_TOKEN) discord.login(process.env.DISCORD_TOKEN);
  else log("⚠️ Geen DISCORD_TOKEN gevonden. Discord commands staan uit.");
}

setInterval(() => { if (!bot || !bot.entity) return; bot.setControlState("jump", true); setTimeout(() => bot.setControlState("jump", false), 400); }, 60000);
setInterval(async () => { if (!bot || !bot.entity) return; if (bot.food < 14) await actions.eatFood().catch(() => {}); }, 15000);
setInterval(() => {
  if (!guardMode || !bot || !bot.entity) return;
  const mob = bot.nearestEntity(entity => entity.type === "mob" && entity.position.distanceTo(bot.entity.position) < 5);
  if (!mob) return;
  bot.lookAt(mob.position.offset(0, 1, 0)).catch(() => {});
  bot.attack(mob);
}, 2000);

createBot();
startDiscordController();
