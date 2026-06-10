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
    mode: "SmartBrain V8",
    foodRuns: 0,
    supplyRuns: 0,
    roadRuns: 0,
    buildRuns: 0,
    minimums: {
      food: Number(process.env.SMART_MIN_FOOD) || 16,
      wood: Number(process.env.SMART_MIN_LOGS) || 32,
      stone: Number(process.env.SMART_MIN_STONE) || 64,
      building: Number(process.env.SMART_MIN_BUILDING) || 64
    }
  };

  async function safe(action, fn) {
    state.lastAction = action;
    try {
      return await fn();
    } catch (err) {
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
    if (category === "wood" && modules.woodcutting?.chopWood) return modules.woodcutting.chopWood(currentBot, mcData(), 10);
    if (category === "stone" && modules.mining?.mineBlock) return modules.mining.mineBlock(currentBot, mcData(), "stone", 12);
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

      if (snap.isNight && modules.sleep?.sleepInNearestBed) return safe("sleep", async () => modules.sleep.sleepInNearestBed(currentBot, false));

      if (snap.food <= 14 || snap.foodCount < state.minimums.food) return safe("food_chain", async () => {
        const ok = await modules.foodChain?.runFoodChain?.(currentBot, currentMcData, modules, { minFood: state.minimums.food });
        if (ok) state.foodRuns++;
        return ok;
      });

      if (snap.emptySlots <= 2) return safe("warehouse_sort", async () => {
        state.supplyRuns++;
        if (modules.warehouseAI?.sortInventory) return modules.warehouseAI.sortInventory(currentBot, modules.storage);
        return modules.storage?.containerStore?.(currentBot, modules.storage.getChestNames(), "SmartBrain V8 Warehouse");
      });

      if (!snap.hasPickaxe && modules.crafting?.craftQuick) return safe("craft_pickaxe", async () => modules.crafting.craftQuick(currentBot, currentMcData, "stone_pickaxe", 1));
      if (!snap.hasAxe && modules.crafting?.craftQuick) return safe("craft_axe", async () => modules.crafting.craftQuick(currentBot, currentMcData, "stone_axe", 1));

      if (snap.woodCount < state.minimums.wood) return safe("request_wood", async () => requestSupply(currentBot, "wood", 64));
      if (snap.stoneCount < state.minimums.stone && snap.hasPickaxe) return safe("request_stone", async () => requestSupply(currentBot, "stone", 64));
      if (snap.buildingCount < state.minimums.building) return safe("request_building", async () => requestSupply(currentBot, "building", 64));

      if (state.cycles % 24 === 0 && modules.roadNetwork?.buildNetwork) return safe("road_network", async () => {
        const ok = await modules.roadNetwork.buildNetwork(currentBot, currentMcData, modules, "cobblestone");
        if (ok) state.roadRuns++;
        return ok;
      });

      if (state.cycles % 40 === 0 && villageBuilder?.start) return safe("village_maintenance", async () => {
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
    state.loop = setInterval(() => tick().catch(() => {}), Number(process.env.SMART_INTERVAL_MS) || 15000);
    const currentBot = bot();
    if (currentBot) currentBot.chat("🤖 SmartBrain V8 gestart: FoodChain + Supply + Roads + Colony.");
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
    return `🤖 SmartBrain V8: ${state.enabled ? "aan" : "uit"} | Cycles: ${state.cycles} | Busy: ${state.busy} | Last: ${state.lastAction} | Error: ${state.lastError} | FoodRuns: ${state.foodRuns} | SupplyRuns: ${state.supplyRuns} | Roads: ${state.roadRuns} | Builds: ${state.buildRuns} | Food: ${snap?.foodCount ?? "?"}/${state.minimums.food} | Wood: ${snap?.woodCount ?? "?"}/${state.minimums.wood} | Stone: ${snap?.stoneCount ?? "?"}/${state.minimums.stone}`;
  }

  return { state, start, stop, status, tick, getSnapshot: () => getSnapshot(bot(), modules) };
}

module.exports = { createSmartBrainV8 };
