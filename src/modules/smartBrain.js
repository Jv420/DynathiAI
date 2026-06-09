const { wait } = require("../utils/helpers");

function countInventory(bot) {
  return bot.inventory.items().reduce((total, item) => total + item.count, 0);
}

function hasItem(bot, matcher) {
  return bot.inventory.items().some(item => matcher(item.name));
}

function getSnapshot(bot) {
  if (!bot || !bot.entity) return null;

  return {
    health: bot.health,
    food: bot.food,
    position: bot.entity.position.floored(),
    emptySlots: bot.inventory.emptySlotCount(),
    inventoryCount: countInventory(bot),
    isNight: Boolean(bot.time?.isNight || bot.time?.timeOfDay >= 12541),
    hasPickaxe: hasItem(bot, name => name.includes("pickaxe")),
    hasAxe: hasItem(bot, name => name.includes("axe")),
    hasSword: hasItem(bot, name => name.includes("sword")),
    hasFood: hasItem(bot, name =>
      name.includes("bread") ||
      name.includes("apple") ||
      name.includes("beef") ||
      name.includes("chicken") ||
      name.includes("porkchop") ||
      name.includes("mutton") ||
      name.includes("carrot") ||
      name.includes("potato")
    ),
    hasBlocks: hasItem(bot, name =>
      name.includes("planks") ||
      name.includes("cobblestone") ||
      name.includes("stone") ||
      name.includes("dirt")
    )
  };
}

function createCooldowns() {
  return {
    go_home_low_health: 60000,
    go_warehouse_store: 45000,
    go_farm_food: 45000,
    go_lumberyard_wood: 45000,
    sleep_night: 90000,
    low_health_eat_or_stop: 20000,
    eat_food: 15000,
    craft_pickaxe: 60000,
    craft_axe: 60000,
    start_wood_job: 30000
  };
}

function createSmartBrain({ bot, mcData, modules, jobManager, autonomous, villageBuilder, log }) {
  const state = {
    enabled: false,
    busy: false,
    cycles: 0,
    lastAction: "idle",
    lastSkipped: "none",
    loop: null,
    actionTimes: {},
    cooldowns: createCooldowns(),
    homeWaypoint: process.env.SMART_HOME_WAYPOINT || "home",
    warehouseWaypoint: process.env.SMART_WAREHOUSE_WAYPOINT || "warehouse",
    farmWaypoint: process.env.SMART_FARM_WAYPOINT || "farm",
    mineWaypoint: process.env.SMART_MINE_WAYPOINT || "mine",
    lumberWaypoint: process.env.SMART_LUMBER_WAYPOINT || "lumberyard"
  };

  function canRun(action) {
    const cooldown = state.cooldowns[action] || 0;
    const last = state.actionTimes[action] || 0;
    return Date.now() - last >= cooldown;
  }

  function mark(action) {
    state.actionTimes[action] = Date.now();
    state.lastAction = action;
  }

  function skip(action) {
    state.lastSkipped = action;
    return false;
  }

  async function runAction(action, fn) {
    if (!canRun(action)) return skip(`${action}_cooldown`);
    mark(action);
    await fn();
    return true;
  }

  async function goWaypoint(currentBot, waypointName) {
    if (!modules.waypoints?.goToWaypoint) return false;
    currentBot.chat(`📍 Ik ga naar waypoint: ${waypointName}`);
    return modules.waypoints.goToWaypoint(currentBot, waypointName);
  }

  async function goHome(currentBot) {
    return goWaypoint(currentBot, state.homeWaypoint);
  }

  async function goWarehouseAndStore(currentBot) {
    if (jobManager) jobManager.stop(false);
    await goWaypoint(currentBot, state.warehouseWaypoint);
    await wait(1000);
    if (modules.storage?.containerStore) {
      await modules.storage.containerStore(currentBot, modules.storage.getChestNames(), "Chest");
    }
    return true;
  }

  async function goFarmAndHarvest(currentBot, currentMcData) {
    if (jobManager) jobManager.stop(false);
    await goWaypoint(currentBot, state.farmWaypoint);
    await wait(1000);
    if (modules.farming?.farm) await modules.farming.farm(currentBot, currentMcData, "wheat", 20);
    return true;
  }

  async function goLumberyardAndChop(currentBot, currentMcData) {
    if (jobManager) jobManager.stop(false);
    await goWaypoint(currentBot, state.lumberWaypoint);
    await wait(1000);
    if (modules.woodcutting?.chopWood) await modules.woodcutting.chopWood(currentBot, currentMcData, 10);
    return true;
  }

  async function decideAndAct() {
    const currentBot = bot();
    const currentMcData = mcData();
    if (!state.enabled || state.busy || !currentBot || !currentBot.entity) return false;

    state.busy = true;
    state.cycles++;

    try {
      const snap = getSnapshot(currentBot);
      if (!snap) return false;

      if (snap.health <= 6) {
        return runAction("go_home_low_health", async () => {
          currentBot.chat("🚨 Kritieke health. Ik ga naar home als dat kan.");
          if (jobManager) jobManager.stop(false);
          if (autonomous) autonomous.stop();
          if (villageBuilder) villageBuilder.stop();
          if (modules.survival?.eatFood) await modules.survival.eatFood(currentBot);
          await goHome(currentBot);
        });
      }

      if (snap.health <= 10) {
        return runAction("low_health_eat_or_stop", async () => {
          currentBot.chat("🧠 Lage health gedetecteerd. Ik speel veilig.");
          if (jobManager) jobManager.stop(false);
          if (autonomous) autonomous.stop();
          if (villageBuilder) villageBuilder.stop();
          if (modules.survival?.eatFood) await modules.survival.eatFood(currentBot);
        });
      }

      if (snap.isNight && modules.sleep?.sleepInNearestBed) {
        return runAction("sleep_night", async () => {
          if (jobManager) jobManager.stop(false);
          currentBot.chat("🌙 Nacht gedetecteerd. Ik zoek een bed.");
          await modules.sleep.sleepInNearestBed(currentBot, false);
        });
      }

      if (snap.food <= 12) {
        return runAction("eat_food", async () => {
          if (modules.survival?.eatFood) await modules.survival.eatFood(currentBot);
        });
      }

      if (snap.emptySlots <= 2) {
        return runAction("go_warehouse_store", async () => {
          currentBot.chat("🎒 Inventory bijna vol. Ik ga naar warehouse.");
          await goWarehouseAndStore(currentBot);
        });
      }

      if (!snap.hasPickaxe && modules.crafting?.craftQuick) {
        return runAction("craft_pickaxe", async () => {
          await modules.crafting.craftQuick(currentBot, currentMcData, "stone_pickaxe", 1);
        });
      }

      if (!snap.hasAxe && modules.crafting?.craftQuick) {
        return runAction("craft_axe", async () => {
          await modules.crafting.craftQuick(currentBot, currentMcData, "stone_axe", 1);
        });
      }

      if (!snap.hasFood && modules.farming?.farm) {
        return runAction("go_farm_food", async () => {
          currentBot.chat("🌾 Geen eten gevonden. Ik ga naar farm waypoint.");
          await goFarmAndHarvest(currentBot, currentMcData);
        });
      }

      if (jobManager && !jobManager.state.enabled) {
        return runAction("go_lumberyard_wood", async () => {
          currentBot.chat("🌲 Geen actieve job. Ik ga naar lumberyard voor hout.");
          await goLumberyardAndChop(currentBot, currentMcData);
          jobManager.start("wood", "logs");
        });
      }

      state.lastAction = "idle_ok";
      state.lastSkipped = "none";
      return true;
    } catch (err) {
      state.lastAction = `error: ${err.message}`;
      if (log) log(`❌ SmartBrain error: ${err.stack || err.message}`);
      return false;
    } finally {
      state.busy = false;
    }
  }

  function start() {
    if (state.enabled) return false;
    state.enabled = true;
    state.loop = setInterval(() => {
      decideAndAct().catch(() => {});
    }, Number(process.env.SMART_INTERVAL_MS) || 15000);

    const currentBot = bot();
    if (currentBot) currentBot.chat("🧠 SmartBrain V6 gestart.");
    decideAndAct().catch(() => {});
    return true;
  }

  function stop() {
    state.enabled = false;
    if (state.loop) clearInterval(state.loop);
    state.loop = null;
    const currentBot = bot();
    if (currentBot) currentBot.chat("🧠 SmartBrain V6 gestopt.");
    return true;
  }

  function status() {
    const currentBot = bot();
    const snap = getSnapshot(currentBot);
    if (!snap) return "🧠 SmartBrain: bot is nog niet online.";

    return [
      `🧠 SmartBrain: ${state.enabled ? "aan" : "uit"}`,
      `Cycles: ${state.cycles}`,
      `Busy: ${state.busy}`,
      `Last action: ${state.lastAction}`,
      `Last skipped: ${state.lastSkipped}`,
      `Home: ${state.homeWaypoint}`,
      `Warehouse: ${state.warehouseWaypoint}`,
      `Farm: ${state.farmWaypoint}`,
      `Mine: ${state.mineWaypoint}`,
      `Lumber: ${state.lumberWaypoint}`,
      `Night: ${snap.isNight ? "ja" : "nee"}`,
      `Health: ${snap.health}`,
      `Food: ${snap.food}`,
      `Empty slots: ${snap.emptySlots}`,
      `Pickaxe: ${snap.hasPickaxe ? "ja" : "nee"}`,
      `Axe: ${snap.hasAxe ? "ja" : "nee"}`,
      `Food item: ${snap.hasFood ? "ja" : "nee"}`
    ].join(" | ");
  }

  function setHome(name = "home") {
    state.homeWaypoint = name;
    const currentBot = bot();
    if (currentBot) currentBot.chat(`🏠 SmartBrain home waypoint ingesteld op: ${name}`);
    return true;
  }

  function setWarehouse(name = "warehouse") {
    state.warehouseWaypoint = name;
    const currentBot = bot();
    if (currentBot) currentBot.chat(`🏭 SmartBrain warehouse waypoint ingesteld op: ${name}`);
    return true;
  }

  function setFarm(name = "farm") {
    state.farmWaypoint = name;
    const currentBot = bot();
    if (currentBot) currentBot.chat(`🌾 SmartBrain farm waypoint ingesteld op: ${name}`);
    return true;
  }

  function setMine(name = "mine") {
    state.mineWaypoint = name;
    const currentBot = bot();
    if (currentBot) currentBot.chat(`⛏️ SmartBrain mine waypoint ingesteld op: ${name}`);
    return true;
  }

  function setLumber(name = "lumberyard") {
    state.lumberWaypoint = name;
    const currentBot = bot();
    if (currentBot) currentBot.chat(`🌲 SmartBrain lumber waypoint ingesteld op: ${name}`);
    return true;
  }

  return {
    state,
    start,
    stop,
    status,
    tick: decideAndAct,
    setHome,
    setWarehouse,
    setFarm,
    setMine,
    setLumber,
    getSnapshot
  };
}

module.exports = { createSmartBrain };
