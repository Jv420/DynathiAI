const { wait } = require("../utils/helpers");

function countInventory(bot) {
  return bot.inventory.items().reduce((total, item) => total + item.count, 0);
}

function countItems(bot, matcher) {
  return bot.inventory.items()
    .filter(item => matcher(item.name))
    .reduce((total, item) => total + item.count, 0);
}

function hasItem(bot, matcher) {
  return bot.inventory.items().some(item => matcher(item.name));
}

function getSnapshot(bot) {
  if (!bot || !bot.entity) return null;

  const foodCount = countItems(bot, name =>
    name.includes("bread") ||
    name.includes("apple") ||
    name.includes("beef") ||
    name.includes("chicken") ||
    name.includes("porkchop") ||
    name.includes("mutton") ||
    name.includes("carrot") ||
    name.includes("potato")
  );

  const logCount = countItems(bot, name => name.includes("log") || name.includes("stem"));
  const plankCount = countItems(bot, name => name.includes("planks"));
  const fenceCount = countItems(bot, name => name.includes("fence"));
  const stoneCount = countItems(bot, name =>
    name.includes("cobblestone") ||
    name === "stone" ||
    name.includes("deepslate")
  );

  return {
    health: bot.health,
    food: bot.food,
    position: bot.entity.position.floored(),
    emptySlots: bot.inventory.emptySlotCount(),
    inventoryCount: countInventory(bot),
    foodCount,
    logCount,
    plankCount,
    fenceCount,
    stoneCount,
    isNight: Boolean(bot.time?.isNight || bot.time?.timeOfDay >= 12541),
    hasPickaxe: hasItem(bot, name => name.includes("pickaxe")),
    hasAxe: hasItem(bot, name => name.includes("axe")),
    hasSword: hasItem(bot, name => name.includes("sword")),
    hasFood: foodCount > 0,
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
    go_farm_food: 90000,
    go_mine_stone: 90000,
    go_lumberyard_wood: 90000,
    colony_build: 180000,
    expansion_build: 240000,
    project_plan: 60000,
    sleep_night: 90000,
    low_health_eat_or_stop: 20000,
    eat_food: 15000,
    craft_pickaxe: 60000,
    craft_axe: 60000
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
    minimums: {
      food: Number(process.env.SMART_MIN_FOOD) || 16,
      logs: Number(process.env.SMART_MIN_LOGS) || 32,
      stone: Number(process.env.SMART_MIN_STONE) || 64
    },
    colony: {
      enabled: process.env.SMART_COLONY_ENABLED !== "false",
      starterBuilt: false,
      farmBuilt: false,
      warehouseBuilt: false,
      towerBuilt: false
    },
    expansion: {
      enabled: process.env.SMART_EXPANSION_ENABLED !== "false",
      animalPenBuilt: false,
      extraFarmBuilt: false,
      extraStorageBuilt: false
    },
    project: {
      active: "none",
      requiredPlanks: 0,
      progress: 0,
      status: "idle"
    },
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

  function updateProject(snap) {
    if (!state.colony.enabled) {
      state.project = { active: "none", requiredPlanks: 0, progress: 0, status: "colony_off" };
      return state.project;
    }

    if (!state.colony.starterBuilt) {
      state.project = { active: "starter_base", requiredPlanks: 80, progress: snap.plankCount, status: snap.plankCount >= 80 ? "ready_to_build" : "collecting_planks" };
      return state.project;
    }

    if (!state.colony.farmBuilt) {
      state.project = { active: "farm_plot", requiredPlanks: 80, progress: snap.plankCount, status: snap.plankCount >= 80 ? "ready_to_build" : "collecting_planks" };
      return state.project;
    }

    if (!state.colony.warehouseBuilt) {
      state.project = { active: "warehouse", requiredPlanks: 160, progress: snap.plankCount, status: snap.plankCount >= 160 ? "ready_to_build" : "collecting_planks" };
      return state.project;
    }

    if (!state.colony.towerBuilt) {
      state.project = { active: "watchtower", requiredPlanks: 120, progress: snap.plankCount, status: snap.plankCount >= 120 ? "ready_to_build" : "collecting_planks" };
      return state.project;
    }

    if (state.expansion.enabled && !state.expansion.animalPenBuilt) {
      state.project = { active: "animal_pen", requiredPlanks: 64, progress: snap.plankCount + snap.fenceCount, status: (snap.plankCount + snap.fenceCount) >= 64 ? "ready_to_build" : "collecting_materials" };
      return state.project;
    }

    if (state.expansion.enabled && !state.expansion.extraFarmBuilt) {
      state.project = { active: "extra_farm", requiredPlanks: 90, progress: snap.plankCount, status: snap.plankCount >= 90 ? "ready_to_build" : "collecting_planks" };
      return state.project;
    }

    if (state.expansion.enabled && !state.expansion.extraStorageBuilt) {
      state.project = { active: "extra_storage", requiredPlanks: 120, progress: snap.plankCount, status: snap.plankCount >= 120 ? "ready_to_build" : "collecting_planks" };
      return state.project;
    }

    state.project = { active: "complete", requiredPlanks: 0, progress: snap.plankCount, status: "done" };
    return state.project;
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

  async function goMineAndCollect(currentBot, currentMcData) {
    if (jobManager) jobManager.stop(false);
    await goWaypoint(currentBot, state.mineWaypoint);
    await wait(1000);
    if (modules.mining?.mineBlock) await modules.mining.mineBlock(currentBot, currentMcData, "stone", 12);
    return true;
  }

  async function goLumberyardAndChop(currentBot, currentMcData) {
    if (jobManager) jobManager.stop(false);
    await goWaypoint(currentBot, state.lumberWaypoint);
    await wait(1000);
    if (modules.woodcutting?.chopWood) await modules.woodcutting.chopWood(currentBot, currentMcData, 10);
    return true;
  }

  function canColonyBuild(snap) {
    updateProject(snap);
    return state.colony.enabled && modules.baseBuilder && snap.plankCount >= 80 && snap.health > 12 && snap.food > 10 && snap.emptySlots >= 4;
  }

  async function runColonyBuilder(currentBot, snap) {
    if (!canColonyBuild(snap)) return false;

    return runAction("colony_build", async () => {
      if (jobManager) jobManager.stop(false);
      await goHome(currentBot);
      await wait(1000);

      if (!state.colony.starterBuilt) {
        currentBot.chat("🏘️ Project Planner: starter base bouwen.");
        await modules.baseBuilder.buildStarterBase(currentBot, "oak_planks");
        state.colony.starterBuilt = true;
        return;
      }

      if (!state.colony.farmBuilt) {
        currentBot.chat("🏘️ Project Planner: farm plot bouwen.");
        await modules.baseBuilder.buildFarmPlot(currentBot, "oak_planks", 9);
        state.colony.farmBuilt = true;
        return;
      }

      if (!state.colony.warehouseBuilt && snap.plankCount >= 160) {
        currentBot.chat("🏘️ Project Planner: warehouse bouwen.");
        await modules.baseBuilder.buildWarehouse(currentBot, "oak_planks", 11, 5);
        state.colony.warehouseBuilt = true;
        return;
      }

      if (!state.colony.towerBuilt && snap.plankCount >= 120) {
        currentBot.chat("🏘️ Project Planner: watchtower bouwen.");
        await modules.baseBuilder.buildWatchtower(currentBot, "oak_planks", 8);
        state.colony.towerBuilt = true;
      }
    });
  }

  async function runExpansionBuilder(currentBot, snap) {
    if (!state.expansion.enabled || !modules.baseBuilder || !state.colony.towerBuilt) return false;
    if (snap.health <= 12 || snap.food <= 10 || snap.emptySlots < 4) return false;

    return runAction("expansion_build", async () => {
      if (jobManager) jobManager.stop(false);
      await goHome(currentBot);
      await wait(1000);

      if (!state.expansion.animalPenBuilt && (snap.plankCount + snap.fenceCount) >= 64) {
        currentBot.chat("🐄 Expansion Planner: animal pen bouwen.");
        await modules.baseBuilder.buildAnimalPen(currentBot, "oak_fence", 9);
        state.expansion.animalPenBuilt = true;
        return;
      }

      if (!state.expansion.extraFarmBuilt && snap.plankCount >= 90) {
        currentBot.chat("🌾 Expansion Planner: extra farm bouwen.");
        await modules.baseBuilder.buildFarmPlot(currentBot, "oak_planks", 13);
        state.expansion.extraFarmBuilt = true;
        return;
      }

      if (!state.expansion.extraStorageBuilt && snap.plankCount >= 120) {
        currentBot.chat("📦 Expansion Planner: extra storage platform bouwen.");
        await modules.baseBuilder.buildPlatform(currentBot, "oak_planks", 13, 13);
        state.expansion.extraStorageBuilt = true;
      }
    });
  }

  async function runProjectPlanner(currentBot, currentMcData, snap) {
    const project = updateProject(snap);
    if (!state.colony.enabled || project.active === "complete" || project.active === "none") return false;
    if (project.status !== "collecting_planks" && project.status !== "collecting_materials") return false;

    return runAction("project_plan", async () => {
      currentBot.chat(`📋 Project: ${project.active} | Materials: ${project.progress}/${project.requiredPlanks}. Ik verzamel hout.`);
      await goLumberyardAndChop(currentBot, currentMcData);
    });
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
      updateProject(snap);

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

      if (snap.foodCount < state.minimums.food && modules.farming?.farm) {
        return runAction("go_farm_food", async () => {
          currentBot.chat(`🌾 Voedselvoorraad laag: ${snap.foodCount}/${state.minimums.food}. Ik ga farmen.`);
          await goFarmAndHarvest(currentBot, currentMcData);
        });
      }

      if (snap.stoneCount < state.minimums.stone && modules.mining?.mineBlock && snap.hasPickaxe) {
        return runAction("go_mine_stone", async () => {
          currentBot.chat(`⛏️ Steenvoorraad laag: ${snap.stoneCount}/${state.minimums.stone}. Ik ga minen.`);
          await goMineAndCollect(currentBot, currentMcData);
        });
      }

      const colonyResult = await runColonyBuilder(currentBot, snap);
      if (colonyResult) return true;

      const expansionResult = await runExpansionBuilder(currentBot, snap);
      if (expansionResult) return true;

      const projectResult = await runProjectPlanner(currentBot, currentMcData, snap);
      if (projectResult) return true;

      if (snap.logCount < state.minimums.logs && modules.woodcutting?.chopWood && snap.hasAxe) {
        return runAction("go_lumberyard_wood", async () => {
          currentBot.chat(`🌲 Houtvoorraad laag: ${snap.logCount}/${state.minimums.logs}. Ik ga hout halen.`);
          await goLumberyardAndChop(currentBot, currentMcData);
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
    if (currentBot) currentBot.chat("🧠 SmartBrain V10 gestart.");
    decideAndAct().catch(() => {});
    return true;
  }

  function stop() {
    state.enabled = false;
    if (state.loop) clearInterval(state.loop);
    state.loop = null;
    const currentBot = bot();
    if (currentBot) currentBot.chat("🧠 SmartBrain V10 gestopt.");
    return true;
  }

  function colonyStatus() {
    return `🏘️ Colony: ${state.colony.enabled ? "aan" : "uit"} | Starter: ${state.colony.starterBuilt} | Farm: ${state.colony.farmBuilt} | Warehouse: ${state.colony.warehouseBuilt} | Tower: ${state.colony.towerBuilt} | Expansion: ${state.expansion.enabled ? "aan" : "uit"} | AnimalPen: ${state.expansion.animalPenBuilt} | ExtraFarm: ${state.expansion.extraFarmBuilt} | ExtraStorage: ${state.expansion.extraStorageBuilt} | Project: ${state.project.active} ${state.project.progress}/${state.project.requiredPlanks} (${state.project.status})`;
  }

  function status() {
    const currentBot = bot();
    const snap = getSnapshot(currentBot);
    if (!snap) return "🧠 SmartBrain: bot is nog niet online.";
    updateProject(snap);

    return [
      `🧠 SmartBrain: ${state.enabled ? "aan" : "uit"}`,
      `Cycles: ${state.cycles}`,
      `Busy: ${state.busy}`,
      `Last action: ${state.lastAction}`,
      `Last skipped: ${state.lastSkipped}`,
      `Project: ${state.project.active} | ${state.project.progress}/${state.project.requiredPlanks} | ${state.project.status}`,
      `Food stock: ${snap.foodCount}/${state.minimums.food}`,
      `Logs stock: ${snap.logCount}/${state.minimums.logs}`,
      `Planks: ${snap.plankCount}`,
      `Fences: ${snap.fenceCount}`,
      `Stone stock: ${snap.stoneCount}/${state.minimums.stone}`,
      colonyStatus(),
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
      `Axe: ${snap.hasAxe ? "ja" : "nee"}`
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

  function colonyOn() {
    state.colony.enabled = true;
    const currentBot = bot();
    if (currentBot) currentBot.chat("🏘️ Colony Builder aangezet.");
    return true;
  }

  function colonyOff() {
    state.colony.enabled = false;
    const currentBot = bot();
    if (currentBot) currentBot.chat("🏘️ Colony Builder uitgezet.");
    return true;
  }

  function expansionOn() {
    state.expansion.enabled = true;
    const currentBot = bot();
    if (currentBot) currentBot.chat("🗺️ Expansion Planner aangezet.");
    return true;
  }

  function expansionOff() {
    state.expansion.enabled = false;
    const currentBot = bot();
    if (currentBot) currentBot.chat("🗺️ Expansion Planner uitgezet.");
    return true;
  }

  return {
    state,
    start,
    stop,
    status,
    colonyStatus,
    colonyOn,
    colonyOff,
    expansionOn,
    expansionOff,
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
