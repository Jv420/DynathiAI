const { wait } = require("../utils/helpers");

function createAutonomousMode({ bot, mcData, modules, jobManager, brain, log }) {
  const state = {
    enabled: false,
    loop: null,
    busy: false,
    cycles: 0
  };

  async function tick() {
    const currentBot = bot();
    const currentMcData = mcData();

    if (!state.enabled || state.busy || !currentBot || !currentBot.entity) return;

    state.busy = true;
    state.cycles++;

    try {
      if (brain) {
        await brain.brainTick(currentBot, modules);
      }

      if (currentBot.food < 14 && modules.survival?.autoEat) {
        await modules.survival.autoEat(currentBot);
      }

      if (currentBot.inventory.emptySlotCount() <= 2 && modules.storage?.containerStore) {
        await modules.storage.containerStore(currentBot, modules.storage.getChestNames(), "Chest");
      }

      const hasPickaxe = currentBot.inventory.items().some(item => item.name.includes("pickaxe"));
      const hasAxe = currentBot.inventory.items().some(item => item.name.includes("axe"));
      const hasFood = currentBot.inventory.items().some(item =>
        item.name.includes("bread") || item.name.includes("apple") || item.name.includes("beef") || item.name.includes("chicken")
      );

      if (!hasPickaxe && modules.crafting?.craftQuick) {
        await modules.crafting.craftQuick(currentBot, currentMcData, "stone_pickaxe", 1);
      }

      if (!hasAxe && modules.crafting?.craftQuick) {
        await modules.crafting.craftQuick(currentBot, currentMcData, "stone_axe", 1);
      }

      if (!hasFood && modules.farming?.farm) {
        await modules.farming.farm(currentBot, currentMcData, "wheat", 10);
      }

      if (jobManager && !jobManager.state.enabled) {
        jobManager.start("wood", "logs");
      }
    } catch (err) {
      if (log) log(`❌ Autonomous error: ${err.message}`);
    }

    state.busy = false;
  }

  function start() {
    const currentBot = bot();
    if (state.loop) clearInterval(state.loop);

    state.enabled = true;
    state.cycles = 0;
    state.loop = setInterval(tick, Number(process.env.AUTONOMOUS_INTERVAL_MS) || 20000);

    if (currentBot) currentBot.chat("🤖 Autonomous mode gestart.");
    tick();
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
    return `🤖 Autonomous: ${state.enabled ? "aan" : "uit"} | Cycles: ${state.cycles} | Busy: ${state.busy}`;
  }

  return {
    state,
    start,
    stop,
    status,
    tick
  };
}

module.exports = { createAutonomousMode };
