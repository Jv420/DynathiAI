const { wait } = require("../utils/helpers");

function createJobManager({ bot, mcData, actions, log }) {
  const state = {
    enabled: false,
    type: "none",
    target: "none",
    busy: false,
    loop: null,
    cycles: 0,
    lastRunStarted: 0,
    lastRunEnded: 0,
    lastError: "none"
  };

  async function runCycle() {
    const currentBot = bot();
    const currentMcData = mcData();

    if (!state.enabled || !currentBot || !currentBot.entity) return false;

    if (state.busy) {
      if (log) log("⏳ Job cycle overgeslagen: vorige cycle is nog bezig.");
      return false;
    }

    state.busy = true;
    state.cycles++;
    state.lastRunStarted = Date.now();

    try {
      if (state.type === "wood") {
        await actions.chopWood(currentBot, currentMcData, 8);
        if (actions.autoSell && state.enabled) await actions.autoSell(currentBot);
      }

      if (state.type === "mine") {
        await actions.mineBlock(currentBot, currentMcData, state.target || "stone", 8);
        if (actions.autoSell && state.enabled) await actions.autoSell(currentBot);
      }

      if (state.type === "fish") {
        await actions.fishOnce(currentBot);
      }

      if (state.type === "farm") {
        await actions.farm(currentBot, currentMcData, state.target || "wheat", 12);
        if (actions.autoSell && state.enabled) await actions.autoSell(currentBot);
      }

      state.lastError = "none";
      return true;
    } catch (err) {
      state.lastError = err.message;
      if (log) log(`❌ Job error: ${err.message}`);
      return false;
    } finally {
      state.busy = false;
      state.lastRunEnded = Date.now();
    }
  }

  function start(type, target = "none") {
    const currentBot = bot();
    if (!currentBot) return false;

    if (state.enabled && state.type === type && state.target === target) {
      if (log) log(`⏳ Job start overgeslagen: ${type} ${target} draait al.`);
      return false;
    }

    stop(false);

    state.enabled = true;
    state.type = type;
    state.target = target;
    state.cycles = 0;
    state.lastError = "none";

    const delay = type === "fish" ? 20000 : 120000;
    state.loop = setInterval(() => {
      runCycle().catch(err => {
        state.lastError = err.message;
        if (log) log(`❌ Job loop error: ${err.message}`);
      });
    }, delay);

    currentBot.chat(`💼 Job gestart: ${type}${target !== "none" ? " " + target : ""}`);
    if (log) log(`💼 Job gestart: ${type} ${target}`);

    runCycle().catch(err => {
      state.lastError = err.message;
      if (log) log(`❌ Job start cycle error: ${err.message}`);
    });
    return true;
  }

  function stop(say = true) {
    const currentBot = bot();

    state.enabled = false;
    state.type = "none";
    state.target = "none";

    if (state.loop) clearInterval(state.loop);
    state.loop = null;

    if (say && currentBot) currentBot.chat("🛑 Job gestopt.");
    return true;
  }

  function status() {
    return `💼 Job: ${state.enabled ? "aan" : "uit"} | Type: ${state.type} | Target: ${state.target} | Cycles: ${state.cycles} | Busy: ${state.busy} | Last error: ${state.lastError}`;
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
