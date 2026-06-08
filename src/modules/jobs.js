const { wait } = require("../utils/helpers");

function createJobManager({ bot, mcData, actions, log }) {
  const state = {
    enabled: false,
    type: "none",
    target: "none",
    busy: false,
    loop: null,
    cycles: 0
  };

  async function runCycle() {
    const currentBot = bot();
    const currentMcData = mcData();

    if (!state.enabled || state.busy || !currentBot || !currentBot.entity) return;

    state.busy = true;
    state.cycles++;

    try {
      if (state.type === "wood") {
        await actions.chopWood(currentBot, currentMcData, 16);
        if (actions.autoSell) await actions.autoSell(currentBot);
      }

      if (state.type === "mine") {
        await actions.mineBlock(currentBot, currentMcData, state.target || "stone", 16);
        if (actions.autoSell) await actions.autoSell(currentBot);
      }

      if (state.type === "fish") {
        await actions.fishOnce(currentBot);
      }

      if (state.type === "farm") {
        await actions.farm(currentBot, currentMcData, state.target || "wheat", 20);
        if (actions.autoSell) await actions.autoSell(currentBot);
      }
    } catch (err) {
      if (log) log(`❌ Job error: ${err.message}`);
    }

    state.busy = false;
  }

  function start(type, target = "none") {
    const currentBot = bot();
    if (!currentBot) return false;

    stop(false);

    state.enabled = true;
    state.type = type;
    state.target = target;
    state.cycles = 0;

    const delay = type === "fish" ? 15000 : 90000;
    state.loop = setInterval(runCycle, delay);

    currentBot.chat(`💼 Job gestart: ${type}${target !== "none" ? " " + target : ""}`);
    if (log) log(`💼 Job gestart: ${type} ${target}`);

    runCycle();
    return true;
  }

  function stop(say = true) {
    const currentBot = bot();

    state.enabled = false;
    state.type = "none";
    state.target = "none";
    state.busy = false;

    if (state.loop) clearInterval(state.loop);
    state.loop = null;

    if (say && currentBot) currentBot.chat("🛑 Job gestopt.");
    return true;
  }

  function status() {
    return `💼 Job: ${state.enabled ? "aan" : "uit"} | Type: ${state.type} | Target: ${state.target} | Cycles: ${state.cycles} | Busy: ${state.busy}`;
  }

  return {
    state,
    start,
    stop,
    status,
    runCycle
  };
}

module.exports = { createJobManager };
