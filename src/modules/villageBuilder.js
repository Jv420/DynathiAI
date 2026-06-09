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

function status(state) {
  return `🏘️ VillageBuilder: ${state.enabled ? "aan" : "uit"} | Step: ${state.step} | Busy: ${state.busy}`;
}

function createVillageBuilder({ bot, modules, log }) {
  const state = {
    enabled: false,
    busy: false,
    step: "idle",
    origin: null
  };

  async function start(blockName = "oak_planks") {
    const currentBot = bot();
    if (!currentBot || !currentBot.entity) return false;
    if (!modules.baseBuilder) {
      currentBot.chat("❌ BaseBuilder is niet geladen.");
      return false;
    }

    state.enabled = true;
    state.busy = true;
    state.origin = currentBot.entity.position.floored();

    try {
      currentBot.chat(`🏘️ VillageBuilder gestart met ${blockName}. Origin: X:${state.origin.x} Y:${state.origin.y} Z:${state.origin.z}`);

      state.step = "town_square";
      await modules.baseBuilder.buildPlatform(currentBot, blockName, 15, 15);
      if (!state.enabled) return false;

      state.step = "starter_house";
      await safeGoTo(modules, currentBot, offsetFrom(state.origin, 18, 0));
      await modules.baseBuilder.buildStarterBase(currentBot, blockName);
      if (!state.enabled) return false;

      state.step = "farm_plot";
      await safeGoTo(modules, currentBot, offsetFrom(state.origin, -18, 0));
      await modules.baseBuilder.buildFarmPlot(currentBot, blockName, 11);
      if (!state.enabled) return false;

      state.step = "animal_pen";
      await safeGoTo(modules, currentBot, offsetFrom(state.origin, 0, 18));
      await modules.baseBuilder.buildAnimalPen(currentBot, "oak_fence", 11);
      if (!state.enabled) return false;

      state.step = "watchtower";
      await safeGoTo(modules, currentBot, offsetFrom(state.origin, 0, -18));
      await modules.baseBuilder.buildWatchtower(currentBot, blockName, 9);
      if (!state.enabled) return false;

      state.step = "done";
      currentBot.chat("✅ VillageBuilder klaar: square, house, farm, pen en tower gebouwd.");
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

  return {
    state,
    start,
    stop,
    status: () => status(state)
  };
}

module.exports = { createVillageBuilder };
