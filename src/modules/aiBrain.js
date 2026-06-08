function hasItem(bot, keyword) {
  if (!bot || !bot.inventory) return false;
  return bot.inventory.items().some(item => item.name.includes(keyword));
}

function inventoryFreeSlots(bot) {
  if (!bot || !bot.inventory) return 0;
  return bot.inventory.emptySlotCount();
}

function getBrainStatus(bot) {
  if (!bot || !bot.entity) return "❌ Bot is niet online.";

  const needs = [];

  if (bot.food < 14) needs.push("🍗 eten");
  if (bot.health < 12) needs.push("❤️ veiligheid");
  if (inventoryFreeSlots(bot) <= 2) needs.push("📦 inventory leegmaken");
  if (!hasItem(bot, "pickaxe")) needs.push("⛏️ pickaxe nodig");
  if (!hasItem(bot, "axe")) needs.push("🪓 axe nodig");
  if (!hasItem(bot, "fishing_rod")) needs.push("🎣 fishing rod nodig");

  if (!needs.length) return "🧠 Brain: alles ziet er goed uit.";
  return `🧠 Brain needs: ${needs.join(" | ")}`;
}

async function brainTick(bot, modules = {}) {
  if (!bot || !bot.entity) return false;

  try {
    if (bot.food < 14 && modules.survival?.autoEat) {
      await modules.survival.autoEat(bot);
      return true;
    }

    if (bot.health < 10 && modules.combat?.guardTick) {
      await modules.combat.guardTick(bot, 6);
      return true;
    }

    if (inventoryFreeSlots(bot) <= 2 && modules.storage?.containerStore) {
      const chestNames = modules.storage.getChestNames ? modules.storage.getChestNames() : ["chest", "trapped_chest"];
      await modules.storage.containerStore(bot, chestNames, "Chest");
      return true;
    }

    if (modules.sleep?.isNight && modules.sleep?.sleepInNearestBed && modules.sleep.isNight(bot)) {
      await modules.sleep.sleepInNearestBed(bot);
      return true;
    }
  } catch (err) {
    console.log("AI brain tick error:", err.message);
  }

  return false;
}

function createBrainLoop(botGetter, modules = {}, intervalMs = 10000) {
  let loop = null;
  let enabled = false;

  function start() {
    if (loop) clearInterval(loop);
    enabled = true;
    loop = setInterval(() => brainTick(botGetter(), modules), intervalMs);
    const bot = botGetter();
    if (bot) bot.chat("🧠 AI Brain gestart.");
  }

  function stop() {
    enabled = false;
    if (loop) clearInterval(loop);
    loop = null;
    const bot = botGetter();
    if (bot) bot.chat("🛑 AI Brain gestopt.");
  }

  function status() {
    const bot = botGetter();
    return `${enabled ? "🧠 Brain: aan" : "🧠 Brain: uit"} | ${getBrainStatus(bot)}`;
  }

  return { start, stop, status, brainTick };
}

module.exports = {
  hasItem,
  inventoryFreeSlots,
  getBrainStatus,
  brainTick,
  createBrainLoop
};
