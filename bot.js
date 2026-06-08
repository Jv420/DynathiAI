require("dotenv").config();

const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const collectBlock = require("mineflayer-collectblock").plugin;
const { Vec3 } = require("vec3");
const axios = require("axios");
const { startDiscordController } = require("./discordController");

let bot;
let mcData;
let reconnecting = false;
let guardMode = false;

function sendWebhook(message) {
  if (!process.env.DISCORD_WEBHOOK_URL) return;

  axios.post(process.env.DISCORD_WEBHOOK_URL, {
    content: `🤖 **DynathiAI** | ${message}`
  }).catch(() => {});
}

function log(message) {
  console.log(message);
  sendWebhook(message);
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

    if (process.env.OWNER_NAME && username !== process.env.OWNER_NAME) {
      bot.chat("⛔ Alleen mijn eigenaar mag mij commands geven.");
      return;
    }

    const args = message.split(" ");
    const command = args[1]?.toLowerCase();

    try {
      if (command === "help") {
        bot.chat("Commands: follow, stop, mine, chop, build, inv, eat, guard, attack, sell, spawn, home, sethome, bal");
      }

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
    setTimeout(() => {
      if (bot && bot.entity) bot.chat("/spawn");
    }, 4000);
  });

  bot.on("kicked", reason => log("❌ Gekickt: " + reason));
  bot.on("error", err => log("❌ Error: " + err.message));
  bot.on("end", reconnect);
}

function reconnect() {
  if (reconnecting) return;
  reconnecting = true;

  log("🔴 Disconnected. Reconnect over 10 seconden.");

  setTimeout(() => {
    reconnecting = false;
    createBot();
  }, 10000);
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
    bot.pathfinder.setGoal(null);
    bot.clearControlStates();
    bot.chat("✅ Gestopt.");
  },

  async mineBlock(blockName, amount) {
    if (!mcData) return bot.chat("Bot is nog niet klaar.");

    const blockType = mcData.blocksByName[blockName];
    if (!blockType) return bot.chat(`Dat block ken ik niet: ${blockName}`);

    const positions = bot.findBlocks({
      matching: blockType.id,
      maxDistance: 64,
      count: amount
    });

    if (!positions.length) {
      bot.chat(`❌ Ik zie geen ${blockName} dichtbij.`);
      return;
    }

    const blocks = positions
      .map(pos => bot.blockAt(pos))
      .filter(Boolean);

    const tool = bot.inventory.items().find(i =>
      i.name.includes("pickaxe") ||
      i.name.includes("shovel") ||
      i.name.includes("axe")
    );

    if (tool) {
      try {
        await bot.equip(tool, "hand");
      } catch {}
    }

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

    const logNames = [
      "oak_log",
      "birch_log",
      "spruce_log",
      "jungle_log",
      "acacia_log",
      "dark_oak_log",
      "mangrove_log",
      "cherry_log"
    ];

    const ids = logNames
      .map(name => mcData.blocksByName[name]?.id)
      .filter(Boolean);

    const positions = bot.findBlocks({
      matching: ids,
      maxDistance: 64,
      count: amount
    });

    if (!positions.length) {
      bot.chat("❌ Ik zie geen hout dichtbij.");
      return;
    }

    const blocks = positions.map(pos => bot.blockAt(pos)).filter(Boolean);

    const axe = bot.inventory.items().find(i => i.name.includes("axe"));
    if (axe) {
      try {
        await bot.equip(axe, "hand");
      } catch {}
    }

    bot.chat(`🪓 Ik ga ${blocks.length} logs hakken.`);

    try {
      await bot.collectBlock.collect(blocks);
      bot.chat("✅ Klaar met hout hakken.");
    } catch (err) {
      bot.chat("❌ Hout hakken mislukt: " + err.message);
    }
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
    const food = bot.inventory.items().find(i =>
      i.name.includes("bread") ||
      i.name.includes("apple") ||
      i.name.includes("beef") ||
      i.name.includes("porkchop") ||
      i.name.includes("chicken") ||
      i.name.includes("carrot") ||
      i.name.includes("potato")
    );

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
    const mob = bot.nearestEntity(entity =>
      entity.type === "mob" &&
      entity.position.distanceTo(bot.entity.position) < 6
    );

    if (!mob) return bot.chat("Geen mob dichtbij.");

    bot.lookAt(mob.position.offset(0, 1, 0)).catch(() => {});
    bot.attack(mob);
    bot.chat("⚔️ Mob aangevallen.");
  },

  async autoSell() {
    bot.chat("/sell");

    await new Promise(resolve => setTimeout(resolve, 2000));

    const window = bot.currentWindow;

    if (!window) {
      bot.chat("❌ Sell GUI niet geopend.");
      return;
    }

    const sellItems = bot.inventory.items().filter(item => {
      // Bewaar tools en wapens
      if (item.name.includes("pickaxe")) return false;
      if (item.name.includes("axe")) return false;
      if (item.name.includes("shovel")) return false;
      if (item.name.includes("sword")) return false;
      if (item.name.includes("bow")) return false;
      if (item.name.includes("crossbow")) return false;

      // Bewaar armor
      if (item.name.includes("helmet")) return false;
      if (item.name.includes("chestplate")) return false;
      if (item.name.includes("leggings")) return false;
      if (item.name.includes("boots")) return false;

      // Bewaar waardevolle items
      if (item.name.includes("diamond")) return false;
      if (item.name.includes("netherite")) return false;
      if (item.name.includes("emerald")) return false;

      return true;
    });

    if (!sellItems.length) {
      bot.closeWindow(window);
      bot.chat("💰 Geen verkoopbare items gevonden.");
      return;
    }

    let sellSlot = 0;

    for (const item of sellItems) {
      try {
        await bot.moveSlotItem(item.slot, sellSlot);
        sellSlot++;

        // De bovenste 4 rijen van jouw /sell GUI zijn de verkoopvakken.
        if (sellSlot >= 36) break;
      } catch (err) {
        console.log("AutoSell move error:", err.message);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    bot.closeWindow(window);
    bot.chat("💰 AutoSell voltooid.");
  },

  toggleGuard() {
    guardMode = !guardMode;
    return guardMode;
  }
};

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

  const mob = bot.nearestEntity(entity =>
    entity.type === "mob" &&
    entity.position.distanceTo(bot.entity.position) < 5
  );

  if (!mob) return;

  bot.lookAt(mob.position.offset(0, 1, 0)).catch(() => {});
  bot.attack(mob);
}, 2000);

createBot();

startDiscordController({
  botRef: () => bot,
  actions,
  log
});
