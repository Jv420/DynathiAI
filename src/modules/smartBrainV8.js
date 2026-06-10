const { wait } = require("../utils/helpers");

function countItems(bot, matcher) {
  return bot.inventory.items().filter(item => matcher(item.name)).reduce((total, item) => total + item.count, 0);
}

function hasItem(bot, matcher) {
  return bot.inventory.items().some(item => matcher(item.name));
}

function getSnapshot(bot, modules) {
  if (!bot?.entity) return null;
  const foodCount = modules.foodChain?.countFood ? modules.foodChain.countFood(bot) : countItems(bot, n => n.includes("bread") || n.includes("apple") || n.includes("cooked") || n.includes("beef") || n.includes("chicken") || n.includes("porkchop") || n.includes("mutton") || n.includes("carrot") || n.includes("potato"));
  const woodCount = countItems(bot, n => n.includes("log") || n.includes("planks") || n.includes("stem"));
  const stoneCount = countItems(bot, n => n.includes("stone") || n.includes("cobblestone") || n.includes("deepslate"));
  const buildingCount = countItems(bot, n => n.includes("planks") || n.includes("fence") || n.includes("chest") || n.includes("torch") || n.includes("cobblestone"));
  return {
    health: bot.health,
    food: bot.food,
    foodCount,
    woodCount,
    stoneCount,
    buildingCount,
    emptySlots: bot.inventory.emptySlotCount(),
    hasPickaxe: hasItem(bot, n => n.includes("pickaxe")),
    hasAxe: hasItem(bot, n => n.includes("axe")),
    isNight: Boolean(bot.time?.isNight || bot.time?.timeOfDay >= 12541)
  };
}

function createSmartBrainV8({ bot, mcData, modules, jobManager, autonomous, villageBuilder, log }) {
  const state = {
    enabled: false,
    busy: false,
    loop: null,
    cycles: 0,
    lastAction: "idle",
    lastError: "none",
    mode: "SmartBrain V8.1 Stable",
    actionTimes: {},
    failedActions: {},
    foodRuns: 0,
    supplyRuns: 0,
    roadRuns: 0,
    buildRuns: 0,
    minimums: {
      food: Number(process.env.SMART_MIN_FOOD) || 16,
      wood: Number(process.env.SMART_MIN_LOGS) || 24,
      stone: Number(process.env.SMART_MIN_STONE) || 32,
      building: Number(process.env.SMART_MIN_BUILDING) || 48
    },
    cooldowns: {
      low_health: 30000,
      sleep: 180000,
      food_chain: 60000,
      warehouse_sort: 90000,
      craft_pickaxe: 90000,
      craft_axe: 90000,
      request_wood: 120000,
      request_stone: 120000,
      request_building: 120000,
      road_network: 300000,
      village_maintenance: 900000
    }
  };

  function canRun(action) {
    const last = state.actionTimes[action] || 0;
    const fails = state.failedActions[action] || 0;
    const extraBackoff = Math.min(fails * 30000, 180000);
    return Date.now() - last >= ((state.cooldowns[action] || 60000) + extraBackoff);
  }

  async function safe(action, fn) {
    if (!canRun(action)) {
      state.lastAction = `${action}_cooldown`;
      return false;
    }
    state.actionTimes[action] = Date.now();
    state.lastAction = action;
    try {
      const result = await fn();
      if (result) state.failedActions[action] = 0;
      else state.failedActions[action] = (state.failedActions[action] || 0) + 1;
      return result;
    } catch (err) {
      state.failedActions[action] = (state.failedActions[action] || 0) + 1;
      state.lastError = err.message;
      if (log) log(`❌ SmartBrain V8 ${action}: ${err.stack || err.message}`);
      return false;
    }
  }

  async function requestSupply(currentBot, category, count) {
    if (modules.warehouseAI?.requestSupply) {
      const ok = await modules.warehouseAI.requestSupply(currentBot, modules.storage, category, count);
      if (ok) { state.supplyRuns++; return true; }
    }
    if (category === "food" && modules.foodChain?.runFoodChain) return modules.foodChain.runFoodChain(currentBot, mcData(), modules, { minFood: state.minimums.food });
    if (category === "wood" && modules.woodcutting?.chopWood) return modules.woodcutting.chopWood(currentBot, mcData(), 6);
    if (category === "stone" && modules.mining?.mineBlock) return modules.mining.mineBlock(currentBot, mcData(), "stone", 6);
    return false;
  }

  async function tick() {
    const currentBot = bot();
    const currentMcData = mcData();
    if (!state.enabled || state.busy || !currentBot?.entity) return false;
    state.busy = true;
    state.cycles++;

    try {
      const snap = getSnapshot(currentBot, modules);
      if (!snap) return false;

      if (snap.health <= 8) return safe("low_health", async () => {
        if (jobManager) jobManager.stop(false);
        if (autonomous) autonomous.stop();
        if (modules.survival?.eatFood) await modules.survival.eatFood(currentBot);
        if (modules.waypoints?.goToWaypoint) await modules.waypoints.goToWaypoint(currentBot, process.env.SMART_HOME_WAYPOINT || "home");
        return true;
      });

      if (snap.isNight && modules.sleep?.sleepInNearestBed) await safe("sleep", async () => modules.sleep.sleepInNearestBed(currentBot, false));

      if (snap.food <= 14 || snap.foodCount < state.minimums.food) return safe("food_chain", async () => {
        const ok = await modules.foodChain?.runFoodChain?.(currentBot, currentMcData, modules, { minFood: state.minimums.food });
        if (ok) state.foodRuns++;
        return ok;
      });

      if (snap.emptySlots <= 2) return safe("warehouse_sort", async () => {
        if (modules.warehouseAI?.sortInventory) {
          const ok = await modules.warehouseAI.sortInventory(currentBot, modules.storage);
          if (ok) state.supplyRuns++;
          return ok;
        }
        return modules.storage?.containerStore?.(currentBot, modules.storage.getChestNames(), "SmartBrain V8 Warehouse");
      });

      if (!snap.hasPickaxe && modules.crafting?.craftQuick) return safe("craft_pickaxe", async () => modules.crafting.craftQuick(currentBot, currentMcData, "stone_pickaxe", 1));
      if (!snap.hasAxe && modules.crafting?.craftQuick) return safe("craft_axe", async () => modules.crafting.craftQuick(currentBot, currentMcData, "stone_axe", 1));

      if (snap.woodCount < state.minimums.wood) return safe("request_wood", async () => requestSupply(currentBot, "wood", 32));
      if (snap.stoneCount < state.minimums.stone && snap.hasPickaxe) return safe("request_stone", async () => requestSupply(currentBot, "stone", 32));
      if (snap.buildingCount < state.minimums.building) return safe("request_building", async () => requestSupply(currentBot, "building", 32));

      if (state.cycles % 40 === 0 && modules.roadNetwork?.buildNetwork) return safe("road_network", async () => {
        const ok = await modules.roadNetwork.buildNetwork(currentBot, currentMcData, modules, "cobblestone");
        if (ok) state.roadRuns++;
        return ok;
      });

      if (state.cycles % 120 === 0 && villageBuilder?.start && process.env.SMART_AUTO_VILLAGE === "true") return safe("village_maintenance", async () => {
        if (villageBuilder.state?.busy) return false;
        state.buildRuns++;
        return villageBuilder.start("oak_planks");
      });

      state.lastAction = "idle_colonist";
      await wait(900);
      return true;
    } finally {
      state.busy = false;
    }
  }

  function start() {
    if (state.enabled) return false;
    state.enabled = true;
    state.loop = setInterval(() => tick().catch(() => {}), Number(process.env.SMART_INTERVAL_MS) || 30000);
    const currentBot = bot();
    if (currentBot) currentBot.chat("🤖 SmartBrain V8.1 Stable gestart.");
    tick().catch(() => {});
    return true;
  }

  function stop() {
    state.enabled = false;
    if (state.loop) clearInterval(state.loop);
    state.loop = null;
    const currentBot = bot();
    if (currentBot) currentBot.chat("🛑 SmartBrain V8 gestopt.");
    return true;
  }

  function status() {
    const currentBot = bot();
    const snap = getSnapshot(currentBot, modules);
    return `🤖 ${state.mode}: ${state.enabled ? "aan" : "uit"} | Cycles: ${state.cycles} | Busy: ${state.busy} | Last: ${state.lastAction} | Error: ${state.lastError} | FoodRuns: ${state.foodRuns} | SupplyRuns: ${state.supplyRuns} | Roads: ${state.roadRuns} | Builds: ${state.buildRuns} | Food: ${snap?.foodCount ?? "?"}/${state.minimums.food} | Wood: ${snap?.woodCount ?? "?"}/${state.minimums.wood} | Stone: ${snap?.stoneCount ?? "?"}/${state.minimums.stone}`;
  }

  return { state, start, stop, status, tick, getSnapshot: () => getSnapshot(bot(), modules) };
}

module.exports = { createSmartBrainV8 };
