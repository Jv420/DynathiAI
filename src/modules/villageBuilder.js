const { Vec3 } = require("vec3");
const { wait } = require("../utils/helpers");

function offsetFrom(origin, dx, dz) {
  return new Vec3(origin.x + dx, origin.y, origin.z + dz);
}

async function safeGoTo(modules, bot, pos) {
  if (!modules.navigation?.goToCoords) return false;
  await modules.navigation.goToCoords(bot, pos.x, pos.y, pos.z);
  await wait(1000);
  return true;
}

async function setWaypointIfAvailable(modules, bot, name) {
  try {
    if (modules.waypoints?.setWaypoint) await modules.waypoints.setWaypoint(bot, name);
  } catch {}
}

async function buildRoadIfAvailable(modules, bot, mcData, from, to, blockName = "cobblestone") {
  if (!modules.roadNetwork?.buildRoad) return false;
  try {
    return await modules.roadNetwork.buildRoad(bot, mcData, modules, from, to, blockName);
  } catch {
    return false;
  }
}

function status(state) {
  return `🏘️ VillageBuilder V2: ${state.enabled ? "aan" : "uit"} | Step: ${state.step} | Busy: ${state.busy} | Roads: ${state.roadsBuilt} | Buildings: ${state.buildingsBuilt}`;
}

function createVillageBuilder({ bot, mcData, modules, log }) {
  const state = {
    enabled: false,
    busy: false,
    step: "idle",
    origin: null,
    roadsBuilt: 0,
    buildingsBuilt: 0
  };

  async function runStep(name, fn) {
    if (!state.enabled) return false;
    state.step = name;
    await fn();
    state.buildingsBuilt++;
    await wait(900);
    return true;
  }

  async function start(blockName = "oak_planks") {
    const currentBot = bot();
    const currentMcData = mcData?.();
    if (!currentBot || !currentBot.entity) return false;
    if (!modules.baseBuilder) {
      currentBot.chat("❌ BaseBuilder is niet geladen.");
      return false;
    }

    state.enabled = true;
    state.busy = true;
    state.origin = currentBot.entity.position.floored();
    state.roadsBuilt = 0;
    state.buildingsBuilt = 0;

    try {
      currentBot.chat(`🏘️ VillageBuilder V2 gestart met ${blockName}. Origin: X:${state.origin.x} Y:${state.origin.y} Z:${state.origin.z}`);

      await runStep("home/town_square", async () => {
        await setWaypointIfAvailable(modules, currentBot, "home");
        await modules.baseBuilder.buildPlatform(currentBot, blockName, 15, 15);
      });

      await runStep("warehouse", async () => {
        await safeGoTo(modules, currentBot, offsetFrom(state.origin, 0, 24));
        await setWaypointIfAvailable(modules, currentBot, "warehouse");
        await modules.baseBuilder.buildWarehouse(currentBot, blockName, 11, 5);
      });

      await runStep("starter_house", async () => {
        await safeGoTo(modules, currentBot, offsetFrom(state.origin, 22, 0));
        await modules.baseBuilder.buildStarterBase(currentBot, blockName);
      });

      await runStep("farm_plot", async () => {
        await safeGoTo(modules, currentBot, offsetFrom(state.origin, -24, 0));
        await setWaypointIfAvailable(modules, currentBot, "farm");
        await modules.baseBuilder.buildFarmPlot(currentBot, blockName, 13);
      });

      await runStep("animal_pen", async () => {
        await safeGoTo(modules, currentBot, offsetFrom(state.origin, -24, 18));
        await modules.baseBuilder.buildAnimalPen(currentBot, "oak_fence", 13);
      });

      await runStep("mine_marker", async () => {
        await safeGoTo(modules, currentBot, offsetFrom(state.origin, 24, 24));
        await setWaypointIfAvailable(modules, currentBot, "mine");
        await modules.baseBuilder.buildPlatform(currentBot, "cobblestone", 7, 7);
      });

      await runStep("lumberyard", async () => {
        await safeGoTo(modules, currentBot, offsetFrom(state.origin, 24, -24));
        await setWaypointIfAvailable(modules, currentBot, "lumberyard");
        await modules.baseBuilder.buildPlatform(currentBot, blockName, 9, 9);
      });

      await runStep("watchtower", async () => {
        await safeGoTo(modules, currentBot, offsetFrom(state.origin, 0, -24));
        await modules.baseBuilder.buildWatchtower(currentBot, blockName, 9);
      });

      await runStep("outpost", async () => {
        await safeGoTo(modules, currentBot, offsetFrom(state.origin, 48, 0));
        await setWaypointIfAvailable(modules, currentBot, "outpost");
        await modules.baseBuilder.buildStarterBase(currentBot, blockName);
      });

      state.step = "roads";
      const routes = [["home", "warehouse"], ["warehouse", "farm"], ["warehouse", "mine"], ["warehouse", "lumberyard"], ["warehouse", "outpost"]];
      for (const [from, to] of routes) {
        if (!state.enabled) break;
        const ok = await buildRoadIfAvailable(modules, currentBot, currentMcData, from, to, "cobblestone");
        if (ok) state.roadsBuilt++;
        await wait(700);
      }

      state.step = "done";
      currentBot.chat(`✅ VillageBuilder V2 klaar: ${state.buildingsBuilt} bouwstappen, ${state.roadsBuilt} wegen.`);
      return true;
    } catch (err) {
      if (log) log(`❌ VillageBuilder error: ${err.stack || err.message}`);
      currentBot.chat(`❌ VillageBuilder fout: ${err.message}`);
      return false;
    } finally {
      state.busy = false;
      state.enabled = false;
    }
  }

  function stop() {
    const currentBot = bot();
    state.enabled = false;
    state.busy = false;
    state.step = "stopped";
    if (currentBot) currentBot.chat("🛑 VillageBuilder gestopt.");
    return true;
  }

  return { state, start, stop, status: () => status(state) };
}

module.exports = { createVillageBuilder };
