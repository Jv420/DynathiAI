const { wait } = require("../utils/helpers");

function hasItem(bot, matcher) {
  return bot.inventory.items().some(item => matcher(item.name));
}

function countItems(bot, matcher) {
  return bot.inventory.items().filter(item => matcher(item.name)).reduce((total, item) => total + item.count, 0);
}

function hasRawFood(bot) {
  return hasItem(bot, name => name.startsWith("raw_") || name === "potato");
}

function hasCookedFood(bot) {
  return hasItem(bot, name => name.includes("bread") || name.includes("apple") || name.includes("cooked") || name.includes("beef") || name.includes("porkchop") || name.includes("chicken") || name.includes("mutton") || name.includes("carrot") || name.includes("potato"));
}

function createAutonomousMode({ bot, mcData, modules, jobManager, brain, log }) {
  const state = {
    enabled: false,
    loop: null,
    busy: false,
    cycles: 0,
    lastAction: "idle",
    lastError: "none",
    cookingRuns: 0,
    roadRuns: 0,
    logisticsRuns: 0
  };

  async function tick() {
    const currentBot = bot();
    const currentMcData = mcData();
    if (!state.enabled || state.busy || !currentBot || !currentBot.entity) return false;

    state.busy = true;
    state.cycles++;

    try {
      if (brain) {
        state.lastAction = "brain_tick";
        await brain.brainTick(currentBot, modules);
      }

      if (currentBot.food < 14 && modules.survival?.autoEat) {
        state.lastAction = "auto_eat";
        await modules.survival.autoEat(currentBot);
      }

      const foodCount = countItems(currentBot, name => name.includes("bread") || name.includes("apple") || name.includes("cooked") || name.includes("beef") || name.includes("chicken") || name.includes("porkchop") || name.includes("mutton") || name.includes("carrot") || name.includes("potato"));

      if (foodCount < 8 && hasRawFood(currentBot) && modules.cooking?.cookFood) {
        state.lastAction = "cook_food";
        await modules.cooking.cookFood(currentBot, 8);
        state.cookingRuns++;
      }

      if (currentBot.inventory.emptySlotCount() <= 2 && modules.storage?.containerStore) {
        state.lastAction = "smart_store";
        if (modules.storage.storeFood || modules.storage.storeWood || modules.storage.storeStone) {
          await modules.storage.containerStore(currentBot, modules.storage.getChestNames(), "Auto Chest");
        } else {
          await modules.storage.containerStore(currentBot, modules.storage.getChestNames(), "Chest");
        }
        state.logisticsRuns++;
      }

      const hasPickaxe = hasItem(currentBot, name => name.includes("pickaxe"));
      const hasAxe = hasItem(currentBot, name => name.includes("axe"));

      if (!hasPickaxe && modules.crafting?.craftQuick) {
        state.lastAction = "craft_pickaxe";
        await modules.crafting.craftQuick(currentBot, currentMcData, "stone_pickaxe", 1);
      }

      if (!hasAxe && modules.crafting?.craftQuick) {
        state.lastAction = "craft_axe";
        await modules.crafting.craftQuick(currentBot, currentMcData, "stone_axe", 1);
      }

      if (!hasCookedFood(currentBot) && modules.farming?.farm) {
        state.lastAction = "farm_food";
        await modules.farming.farm(currentBot, currentMcData, "wheat", 10);
      }

      if (state.cycles % 20 === 0 && modules.roadNetwork?.buildNetwork) {
        state.lastAction = "road_network_check";
        await modules.roadNetwork.buildNetwork(currentBot, currentMcData, modules, "cobblestone");
        state.roadRuns++;
      }

      if (jobManager && !jobManager.state.enabled) {
        state.lastAction = "start_wood_job";
        jobManager.start("wood", "logs");
      }

      state.lastError = "none";
      return true;
    } catch (err) {
      state.lastError = err.message;
      if (log) log(`❌ Autonomous error: ${err.stack || err.message}`);
      return false;
    } finally {
      state.busy = false;
    }
  }

  function start() {
    const currentBot = bot();
    if (state.loop) clearInterval(state.loop);
    state.enabled = true;
    state.cycles = 0;
    state.loop = setInterval(() => tick().catch(() => {}), Number(process.env.AUTONOMOUS_INTERVAL_MS) || 20000);
    if (currentBot) currentBot.chat("🤖 Autonomous mode gestart.");
    tick().catch(() => {});
    return true;
  }

  function stop() {
    const currentBot = bot();
    state.enabled = false;
    state.busy = false;
    if (state.loop) clearInterval(state.loop);
    state.loop = null;
    if (jobManager) jobManager.stop(false);
    if (currentBot) currentBot.chat("🛑 Autonomous mode gestopt.");
    return true;
  }

  function status() {
    return `🤖 Autonomous: ${state.enabled ? "aan" : "uit"} | Cycles: ${state.cycles} | Busy: ${state.busy} | Last: ${state.lastAction} | Cooking: ${state.cookingRuns} | Logistics: ${state.logisticsRuns} | Roads: ${state.roadRuns} | Error: ${state.lastError}`;
  }

  return { state, start, stop, status, tick };
}

module.exports = { createAutonomousMode };
