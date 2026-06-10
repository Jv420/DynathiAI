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

  const foodCount = countItems(bot, name => name.includes("bread") || name.includes("apple") || name.includes("beef") || name.includes("chicken") || name.includes("porkchop") || name.includes("mutton") || name.includes("carrot") || name.includes("potato"));
  const logCount = countItems(bot, name => name.includes("log") || name.includes("stem"));
  const plankCount = countItems(bot, name => name.includes("planks"));
  const fenceCount = countItems(bot, name => name.includes("fence"));
  const stoneCount = countItems(bot, name => name.includes("cobblestone") || name === "stone" || name.includes("deepslate"));

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
    hasBlocks: hasItem(bot, name => name.includes("planks") || name.includes("cobblestone") || name.includes("stone") || name.includes("dirt"))
  };
}

function createCooldowns() {
  return {
    go_home_low_health: 60000,
    go_warehouse_store: 45000,
    auto_logistics: 90000,
    go_farm_food: 90000,
    go_mine_stone: 90000,
    go_lumberyard_wood: 90000,
    colony_build: 180000,
    expansion_build: 240000,
    territory_build: 300000,
    project_plan: 60000,
    supply_food: 60000,
    supply_wood: 60000,
    supply_stone: 60000,
    supply_building: 60000,
    role_switch: 30000,
    sleep_night: 180000,
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
    chatTimes: {},
    role: "Idle",
    task: "Wachten",
    cooldowns: createCooldowns(),
    storageMode: "multi-network + auto-logistics",
    logistics: {
      enabled: process.env.SMART_LOGISTICS_ENABLED !== "false",
      lastRoute: "none",
      movedRuns: 0
    },
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
    territory: {
      enabled: process.env.SMART_TERRITORY_ENABLED !== "false",
      outpostWaypoint: process.env.SMART_OUTPOST_WAYPOINT || "outpost",
      outpostBuilt: false,
      outpostFarmBuilt: false,
      outpostStorageBuilt: false
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

  function say(key, message, cooldown = 60000) {
    const now = Date.now();
    const last = state.chatTimes[key] || 0;
    if (now - last < cooldown) return false;
    state.chatTimes[key] = now;
    const currentBot = bot();
    if (currentBot) currentBot.chat(message);
    return true;
  }

  function setRole(role, task) {
    state.role = role;
    state.task = task;
    state.lastAction = `${role}: ${task}`;
  }

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

  function getStorageRoute(type) {
    if (type === "food") return [state.farmWaypoint, state.warehouseWaypoint];
    if (type === "wood") return [state.lumberWaypoint, state.warehouseWaypoint];
    if (type === "stone") return [state.mineWaypoint, state.warehouseWaypoint];
    if (type === "building") return [state.warehouseWaypoint, state.lumberWaypoint, state.territory.outpostWaypoint];
    return [state.warehouseWaypoint];
  }

  function storageStatus() {
    return `Storage mode: ${state.storageMode} | Logistics: ${state.logistics.enabled ? "aan" : "uit"} | Last logistics: ${state.logistics.lastRoute} | Runs: ${state.logistics.movedRuns} | Food: ${getStorageRoute("food").join(" -> ")} | Wood: ${getStorageRoute("wood").join(" -> ")} | Stone: ${getStorageRoute("stone").join(" -> ")} | Building: ${getStorageRoute("building").join(" -> ")}`;
  }

  function classifyItem(name) {
    if (name.includes("bread") || name.includes("apple") || name.includes("beef") || name.includes("chicken") || name.includes("porkchop") || name.includes("mutton") || name.includes("carrot") || name.includes("potato") || name.includes("wheat") || name.includes("seed")) return "food";
    if (name.includes("log") || name.includes("stem") || name.includes("planks") || name.includes("sapling")) return "wood";
    if (name.includes("cobblestone") || name === "stone" || name.includes("deepslate") || name.includes("ore") || name.includes("coal") || name.includes("iron") || name.includes("copper") || name.includes("gold") || name.includes("redstone") || name.includes("lapis")) return "stone";
    if (name.includes("fence") || name.includes("chest") || name.includes("crafting_table") || name.includes("door") || name.includes("stairs") || name.includes("slab") || name.includes("glass")) return "building";
    return "warehouse";
  }

  function getLogisticsTarget(category) {
    if (category === "food") return state.farmWaypoint;
    if (category === "wood") return state.lumberWaypoint;
    if (category === "stone") return state.mineWaypoint;
    if (category === "building") return state.warehouseWaypoint;
    return state.warehouseWaypoint;
  }

  function updateProject(snap) {
    if (!state.colony.enabled) return state.project = { active: "none", requiredPlanks: 0, progress: 0, status: "colony_off" };
    if (!state.colony.starterBuilt) return state.project = { active: "starter_base", requiredPlanks: 80, progress: snap.plankCount, status: snap.plankCount >= 80 ? "ready_to_build" : "collecting_planks" };
    if (!state.colony.farmBuilt) return state.project = { active: "farm_plot", requiredPlanks: 80, progress: snap.plankCount, status: snap.plankCount >= 80 ? "ready_to_build" : "collecting_planks" };
    if (!state.colony.warehouseBuilt) return state.project = { active: "warehouse", requiredPlanks: 160, progress: snap.plankCount, status: snap.plankCount >= 160 ? "ready_to_build" : "collecting_planks" };
    if (!state.colony.towerBuilt) return state.project = { active: "watchtower", requiredPlanks: 120, progress: snap.plankCount, status: snap.plankCount >= 120 ? "ready_to_build" : "collecting_planks" };
    if (state.expansion.enabled && !state.expansion.animalPenBuilt) return state.project = { active: "animal_pen", requiredPlanks: 64, progress: snap.plankCount + snap.fenceCount, status: (snap.plankCount + snap.fenceCount) >= 64 ? "ready_to_build" : "collecting_materials" };
    if (state.expansion.enabled && !state.expansion.extraFarmBuilt) return state.project = { active: "extra_farm", requiredPlanks: 90, progress: snap.plankCount, status: snap.plankCount >= 90 ? "ready_to_build" : "collecting_planks" };
    if (state.expansion.enabled && !state.expansion.extraStorageBuilt) return state.project = { active: "extra_storage", requiredPlanks: 120, progress: snap.plankCount, status: snap.plankCount >= 120 ? "ready_to_build" : "collecting_planks" };
    if (state.territory.enabled && !state.territory.outpostBuilt) return state.project = { active: "outpost_base", requiredPlanks: 100, progress: snap.plankCount, status: snap.plankCount >= 100 ? "ready_to_build" : "collecting_planks" };
    if (state.territory.enabled && !state.territory.outpostFarmBuilt) return state.project = { active: "outpost_farm", requiredPlanks: 80, progress: snap.plankCount, status: snap.plankCount >= 80 ? "ready_to_build" : "collecting_planks" };
    if (state.territory.enabled && !state.territory.outpostStorageBuilt) return state.project = { active: "outpost_storage", requiredPlanks: 100, progress: snap.plankCount, status: snap.plankCount >= 100 ? "ready_to_build" : "collecting_planks" };
    return state.project = { active: "complete", requiredPlanks: 0, progress: snap.plankCount, status: "done" };
  }

  function chooseRole(snap) {
    const project = updateProject(snap);
    if (snap.health <= 10) return setRole("Survivor", "Veiligheid en eten");
    if (snap.emptySlots <= 2) return setRole("Logistics Manager", "Inventory sorteren");
    if (snap.isNight) return setRole("Sleeper", "Bed zoeken");
    if (snap.foodCount < state.minimums.food || snap.food <= 12) return setRole("Farmer", "Voedsel regelen");
    if (!snap.hasPickaxe || !snap.hasAxe) return setRole("Crafter", "Tools maken");
    if (snap.stoneCount < state.minimums.stone) return setRole("Miner", "Steen verzamelen");
    if (project.status === "ready_to_build") return setRole("Builder", `Project bouwen: ${project.active}`);
    if (project.status === "collecting_planks" || project.status === "collecting_materials") return setRole("Lumberjack", `Materialen voor ${project.active}`);
    if (snap.logCount < state.minimums.logs) return setRole("Lumberjack", "Houtvoorraad aanvullen");
    return setRole("Colonist", "Onderhoud en wachten");
  }

  async function goWaypoint(currentBot, waypointName) {
    if (!modules.waypoints?.goToWaypoint) return false;
    say(`goto_${waypointName}`, `📍 Ik ga naar waypoint: ${waypointName}`, 45000);
    return modules.waypoints.goToWaypoint(currentBot, waypointName);
  }

  async function goHome(currentBot) { return goWaypoint(currentBot, state.homeWaypoint); }

  async function storeAllAt(currentBot, waypointName, label) {
    if (!modules.storage?.containerStore) return false;
    await goWaypoint(currentBot, waypointName);
    await wait(1000);
    return modules.storage.containerStore(currentBot, modules.storage.getChestNames(), label || waypointName);
  }

  async function autoLogistics(currentBot) {
    if (!state.logistics.enabled || !modules.storage?.containerStore) return false;
    return runAction("auto_logistics", async () => {
      if (jobManager) jobManager.stop(false);
      setRole("Logistics Manager", "Items sorteren naar opslagnetwerk");
      const items = currentBot.inventory.items().filter(Boolean);
      const categories = new Set(items.map(item => classifyItem(item.name)));
      const priority = ["food", "wood", "stone", "building", "warehouse"];
      const firstCategory = priority.find(cat => categories.has(cat)) || "warehouse";
      const target = getLogisticsTarget(firstCategory);
      state.logistics.lastRoute = `${firstCategory} -> ${target}`;
      state.logistics.movedRuns++;
      say("auto_logistics", `🚚 Logistics: ${firstCategory} naar ${target}.`, 60000);
      await storeAllAt(currentBot, target, `Logistics ${target}`);
    });
  }

  async function goWarehouseAndStore(currentBot) {
    if (state.logistics.enabled) return autoLogistics(currentBot);
    if (jobManager) jobManager.stop(false);
    setRole("Warehouse Manager", "Opslaan in warehouse");
    await goWaypoint(currentBot, state.warehouseWaypoint);
    await wait(1000);
    if (modules.storage?.containerStore) await modules.storage.containerStore(currentBot, modules.storage.getChestNames(), "Warehouse");
    return true;
  }

  async function takeFromStorageNetwork(currentBot, type, count) {
    if (!modules.storage) return false;
    if (jobManager) jobManager.stop(false);
    setRole("Warehouse Manager", `Voorraad netwerk: ${type}`);
    const names = modules.storage.getChestNames();
    const route = getStorageRoute(type);

    for (const waypointName of route) {
      if (!waypointName) continue;
      say(`supply_route_${type}_${waypointName}`, `📦 Voorraad zoeken: ${type} bij ${waypointName}`, 60000);
      await goWaypoint(currentBot, waypointName);
      await wait(1000);
      let took = false;
      if (type === "food" && modules.storage.takeFood) took = await modules.storage.takeFood(currentBot, names, waypointName, count || 32);
      if (type === "wood" && modules.storage.takeWood) took = await modules.storage.takeWood(currentBot, names, waypointName, count || 64);
      if (type === "stone" && modules.storage.takeStone) took = await modules.storage.takeStone(currentBot, names, waypointName, count || 64);
      if (type === "building" && modules.storage.takeBuildingSupplies) took = await modules.storage.takeBuildingSupplies(currentBot, names, waypointName, count || 128);
      if (took) return true;
      await wait(500);
    }

    say(`supply_empty_${type}`, `📦 Geen ${type} voorraad gevonden in storage netwerk.`, 60000);
    return false;
  }

  async function goFarmAndHarvest(currentBot, currentMcData) {
    if (jobManager) jobManager.stop(false);
    setRole("Farmer", "Farmen bij farm waypoint");
    await goWaypoint(currentBot, state.farmWaypoint);
    await wait(1000);
    if (modules.farming?.farm) await modules.farming.farm(currentBot, currentMcData, "wheat", 8);
    return true;
  }

  async function goMineAndCollect(currentBot, currentMcData) {
    if (jobManager) jobManager.stop(false);
    setRole("Miner", "Steen verzamelen");
    await goWaypoint(currentBot, state.mineWaypoint);
    await wait(1000);
    if (modules.mining?.mineBlock) await modules.mining.mineBlock(currentBot, currentMcData, "stone", 12);
    return true;
  }

  async function goLumberyardAndChop(currentBot, currentMcData) {
    if (jobManager) jobManager.stop(false);
    setRole("Lumberjack", "Hout verzamelen");
    await goWaypoint(currentBot, state.lumberWaypoint);
    await wait(1000);
    if (modules.woodcutting?.chopWood) await modules.woodcutting.chopWood(currentBot, currentMcData, 10);
    return true;
  }

  async function ensureBuildingSupplies(currentBot, snap, needed = 80) {
    if (snap.plankCount >= needed) return false;
    return runAction("supply_building", async () => {
      say("supply_building", `🏭 Te weinig bouwmateriaal (${snap.plankCount}/${needed}). Ik check storage netwerk.`, 60000);
      await takeFromStorageNetwork(currentBot, "building", Math.max(needed - snap.plankCount, 64));
    });
  }

  async function runColonyBuilder(currentBot, snap) {
    if (!state.colony.enabled || !modules.baseBuilder || snap.health <= 12 || snap.food <= 10 || snap.emptySlots < 4) return false;
    if (snap.plankCount < 80) return ensureBuildingSupplies(currentBot, snap, 80);
    return runAction("colony_build", async () => {
      if (jobManager) jobManager.stop(false);
      setRole("Builder", `Bouwen: ${state.project.active}`);
      await goHome(currentBot);
      await wait(1000);
      if (!state.colony.starterBuilt) { say("build_starter", "🏘️ Autonome kolonist: starter base bouwen.", 60000); await modules.baseBuilder.buildStarterBase(currentBot, "oak_planks"); state.colony.starterBuilt = true; return; }
      if (!state.colony.farmBuilt) { say("build_farm_plot", "🏘️ Autonome kolonist: farm plot bouwen.", 60000); await modules.baseBuilder.buildFarmPlot(currentBot, "oak_planks", 9); state.colony.farmBuilt = true; return; }
      if (!state.colony.warehouseBuilt) { if (snap.plankCount < 160) return; say("build_warehouse", "🏘️ Autonome kolonist: warehouse bouwen.", 60000); await modules.baseBuilder.buildWarehouse(currentBot, "oak_planks", 11, 5); state.colony.warehouseBuilt = true; return; }
      if (!state.colony.towerBuilt) { if (snap.plankCount < 120) return; say("build_tower", "🏘️ Autonome kolonist: watchtower bouwen.", 60000); await modules.baseBuilder.buildWatchtower(currentBot, "oak_planks", 8); state.colony.towerBuilt = true; }
    });
  }

  async function runExpansionBuilder(currentBot, snap) {
    if (!state.expansion.enabled || !state.colony.towerBuilt || !modules.baseBuilder || snap.health <= 12 || snap.food <= 10 || snap.emptySlots < 4) return false;
    if (snap.plankCount < 64 && snap.fenceCount < 64) return ensureBuildingSupplies(currentBot, snap, 90);
    return runAction("expansion_build", async () => {
      if (jobManager) jobManager.stop(false);
      setRole("Builder", `Uitbreiden: ${state.project.active}`);
      await goHome(currentBot);
      await wait(1000);
      if (!state.expansion.animalPenBuilt && (snap.plankCount + snap.fenceCount) >= 64) { say("build_pen", "🐄 Autonome kolonist: animal pen bouwen.", 60000); await modules.baseBuilder.buildAnimalPen(currentBot, "oak_fence", 9); state.expansion.animalPenBuilt = true; return; }
      if (!state.expansion.extraFarmBuilt && snap.plankCount >= 90) { say("build_extra_farm", "🌾 Autonome kolonist: extra farm bouwen.", 60000); await modules.baseBuilder.buildFarmPlot(currentBot, "oak_planks", 13); state.expansion.extraFarmBuilt = true; return; }
      if (!state.expansion.extraStorageBuilt && snap.plankCount >= 120) { say("build_extra_storage", "📦 Autonome kolonist: extra storage platform bouwen.", 60000); await modules.baseBuilder.buildPlatform(currentBot, "oak_planks", 13, 13); state.expansion.extraStorageBuilt = true; }
    });
  }

  async function runTerritoryBuilder(currentBot, snap) {
    if (!state.territory.enabled || !state.expansion.extraStorageBuilt || !modules.baseBuilder || snap.health <= 12 || snap.food <= 10 || snap.emptySlots < 4) return false;
    if (snap.plankCount < 80) return ensureBuildingSupplies(currentBot, snap, 100);
    return runAction("territory_build", async () => {
      if (jobManager) jobManager.stop(false);
      setRole("Outpost Builder", `Territory: ${state.project.active}`);
      await goWaypoint(currentBot, state.territory.outpostWaypoint);
      await wait(1000);
      if (!state.territory.outpostBuilt && snap.plankCount >= 100) { say("build_outpost", "🏕️ Territory: outpost base bouwen.", 60000); await modules.baseBuilder.buildStarterBase(currentBot, "oak_planks"); state.territory.outpostBuilt = true; return; }
      if (!state.territory.outpostFarmBuilt && snap.plankCount >= 80) { say("build_outpost_farm", "🌾 Territory: outpost farm bouwen.", 60000); await modules.baseBuilder.buildFarmPlot(currentBot, "oak_planks", 9); state.territory.outpostFarmBuilt = true; return; }
      if (!state.territory.outpostStorageBuilt && snap.plankCount >= 100) { say("build_outpost_storage", "📦 Territory: outpost storage bouwen.", 60000); await modules.baseBuilder.buildPlatform(currentBot, "oak_planks", 11, 11); state.territory.outpostStorageBuilt = true; }
    });
  }

  async function runProjectPlanner(currentBot, currentMcData, snap) {
    const project = updateProject(snap);
    if (!state.colony.enabled || project.active === "complete" || project.active === "none") return false;
    if (project.status !== "collecting_planks" && project.status !== "collecting_materials") return false;
    return runAction("project_plan", async () => {
      const took = await takeFromStorageNetwork(currentBot, "building", Math.max(project.requiredPlanks - project.progress, 64));
      if (took) return;
      setRole("Lumberjack", `Materialen voor ${project.active}`);
      say("project_collect", `📋 Project: ${project.active} | ${project.progress}/${project.requiredPlanks}. Storage netwerk leeg, ik verzamel hout.`, 60000);
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
      chooseRole(snap);
      if (snap.health <= 6) return runAction("go_home_low_health", async () => { say("low_health", "🚨 Kritieke health. Kolonist gaat naar home.", 60000); if (jobManager) jobManager.stop(false); if (autonomous) autonomous.stop(); if (villageBuilder) villageBuilder.stop(); if (modules.survival?.eatFood) await modules.survival.eatFood(currentBot); await goHome(currentBot); });
      if (snap.health <= 10) return runAction("low_health_eat_or_stop", async () => { say("safe_health", "🧠 Kolonist speelt veilig: lage health.", 60000); if (jobManager) jobManager.stop(false); if (autonomous) autonomous.stop(); if (villageBuilder) villageBuilder.stop(); if (modules.survival?.eatFood) await modules.survival.eatFood(currentBot); });
      if (snap.isNight && modules.sleep?.sleepInNearestBed) return runAction("sleep_night", async () => { if (jobManager) jobManager.stop(false); say("sleep_night", "🌙 Nacht. Ik zoek rustig een bed.", 180000); await modules.sleep.sleepInNearestBed(currentBot, false); });
      if (snap.food <= 12) return runAction("eat_food", async () => { if (modules.survival?.eatFood) await modules.survival.eatFood(currentBot); });
      if (snap.emptySlots <= 2) return autoLogistics(currentBot);
      if (!snap.hasPickaxe && modules.crafting?.craftQuick) return runAction("craft_pickaxe", async () => { setRole("Crafter", "Pickaxe maken"); await modules.crafting.craftQuick(currentBot, currentMcData, "stone_pickaxe", 1); });
      if (!snap.hasAxe && modules.crafting?.craftQuick) return runAction("craft_axe", async () => { setRole("Crafter", "Axe maken"); await modules.crafting.craftQuick(currentBot, currentMcData, "stone_axe", 1); });
      if (snap.foodCount < state.minimums.food) return runAction("supply_food", async () => { say("food_low", `🌾 Voedsel laag: ${snap.foodCount}/${state.minimums.food}. Ik check farm -> warehouse.`, 60000); const took = await takeFromStorageNetwork(currentBot, "food", 32); if (!took && modules.farming?.farm) await goFarmAndHarvest(currentBot, currentMcData); });
      if (snap.stoneCount < state.minimums.stone && snap.hasPickaxe) return runAction("supply_stone", async () => { say("stone_low", `⛏️ Steen laag: ${snap.stoneCount}/${state.minimums.stone}. Ik check mine -> warehouse.`, 60000); const took = await takeFromStorageNetwork(currentBot, "stone", 64); if (!took && modules.mining?.mineBlock) await goMineAndCollect(currentBot, currentMcData); });
      const colonyResult = await runColonyBuilder(currentBot, snap); if (colonyResult) return true;
      const expansionResult = await runExpansionBuilder(currentBot, snap); if (expansionResult) return true;
      const territoryResult = await runTerritoryBuilder(currentBot, snap); if (territoryResult) return true;
      const projectResult = await runProjectPlanner(currentBot, currentMcData, snap); if (projectResult) return true;
      if (snap.logCount < state.minimums.logs && snap.hasAxe) return runAction("supply_wood", async () => { say("wood_low", `🌲 Hout laag: ${snap.logCount}/${state.minimums.logs}. Ik check lumberyard -> warehouse.`, 60000); const took = await takeFromStorageNetwork(currentBot, "wood", 64); if (!took && modules.woodcutting?.chopWood) await goLumberyardAndChop(currentBot, currentMcData); });
      setRole("Colonist", "Onderhoud en wachten");
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
    state.loop = setInterval(() => { decideAndAct().catch(() => {}); }, Number(process.env.SMART_INTERVAL_MS) || 15000);
    say("smart_start", "🤖 Autonome SMP-beschaving gestart.", 30000);
    decideAndAct().catch(() => {});
    return true;
  }

  function stop() {
    state.enabled = false;
    if (state.loop) clearInterval(state.loop);
    state.loop = null;
    say("smart_stop", "🤖 Autonome SMP-beschaving gestopt.", 30000);
    return true;
  }

  function colonyStatus() {
    return `🏘️ Colony: ${state.colony.enabled ? "aan" : "uit"} | Starter: ${state.colony.starterBuilt} | Farm: ${state.colony.farmBuilt} | Warehouse: ${state.colony.warehouseBuilt} | Tower: ${state.colony.towerBuilt} | Expansion: ${state.expansion.enabled ? "aan" : "uit"} | AnimalPen: ${state.expansion.animalPenBuilt} | ExtraFarm: ${state.expansion.extraFarmBuilt} | ExtraStorage: ${state.expansion.extraStorageBuilt} | Territory: ${state.territory.enabled ? "aan" : "uit"} | Outpost: ${state.territory.outpostWaypoint} | OutpostBuilt: ${state.territory.outpostBuilt} | Project: ${state.project.active} ${state.project.progress}/${state.project.requiredPlanks} (${state.project.status}) | Role: ${state.role}`;
  }

  function status() {
    const currentBot = bot();
    const snap = getSnapshot(currentBot);
    if (!snap) return "🧠 SmartBrain: bot is nog niet online.";
    updateProject(snap);
    chooseRole(snap);
    return [
      `🤖 Autonome SMP-beschaving: ${state.enabled ? "aan" : "uit"}`,
      `Role: ${state.role}`,
      `Task: ${state.task}`,
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
      storageStatus(),
      colonyStatus(),
      `Home: ${state.homeWaypoint}`,
      `Warehouse: ${state.warehouseWaypoint}`,
      `Farm: ${state.farmWaypoint}`,
      `Mine: ${state.mineWaypoint}`,
      `Lumber: ${state.lumberWaypoint}`,
      `Outpost: ${state.territory.outpostWaypoint}`,
      `Night: ${snap.isNight ? "ja" : "nee"}`,
      `Health: ${snap.health}`,
      `Food: ${snap.food}`,
      `Empty slots: ${snap.emptySlots}`,
      `Pickaxe: ${snap.hasPickaxe ? "ja" : "nee"}`,
      `Axe: ${snap.hasAxe ? "ja" : "nee"}`
    ].join(" | ");
  }

  function setHome(name = "home") { state.homeWaypoint = name; say("set_home", `🏠 SmartBrain home waypoint ingesteld op: ${name}`, 10000); return true; }
  function setWarehouse(name = "warehouse") { state.warehouseWaypoint = name; say("set_warehouse", `🏭 SmartBrain warehouse waypoint ingesteld op: ${name}`, 10000); return true; }
  function setFarm(name = "farm") { state.farmWaypoint = name; say("set_farm", `🌾 SmartBrain farm waypoint ingesteld op: ${name}`, 10000); return true; }
  function setMine(name = "mine") { state.mineWaypoint = name; say("set_mine", `⛏️ SmartBrain mine waypoint ingesteld op: ${name}`, 10000); return true; }
  function setLumber(name = "lumberyard") { state.lumberWaypoint = name; say("set_lumber", `🌲 SmartBrain lumber waypoint ingesteld op: ${name}`, 10000); return true; }
  function colonyOn() { state.colony.enabled = true; say("colony_on", "🏘️ Colony Builder aangezet.", 10000); return true; }
  function colonyOff() { state.colony.enabled = false; say("colony_off", "🏘️ Colony Builder uitgezet.", 10000); return true; }
  function expansionOn() { state.expansion.enabled = true; say("expansion_on", "🗺️ Expansion Planner aangezet.", 10000); return true; }
  function expansionOff() { state.expansion.enabled = false; say("expansion_off", "🗺️ Expansion Planner uitgezet.", 10000); return true; }
  function territoryOn() { state.territory.enabled = true; say("territory_on", "🏴 Territory System aangezet.", 10000); return true; }
  function territoryOff() { state.territory.enabled = false; say("territory_off", "🏴 Territory System uitgezet.", 10000); return true; }
  function setOutpost(name = "outpost") { state.territory.outpostWaypoint = name; say("set_outpost", `🏕️ Outpost waypoint ingesteld op: ${name}`, 10000); return true; }
  function logisticsOn() { state.logistics.enabled = true; say("logistics_on", "🚚 Auto Logistics aangezet.", 10000); return true; }
  function logisticsOff() { state.logistics.enabled = false; say("logistics_off", "🚚 Auto Logistics uitgezet.", 10000); return true; }

  return {
    state,
    start,
    stop,
    status,
    colonyStatus,
    storageStatus,
    colonyOn,
    colonyOff,
    expansionOn,
    expansionOff,
    territoryOn,
    territoryOff,
    logisticsOn,
    logisticsOff,
    setOutpost,
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
