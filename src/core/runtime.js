const { createLogger } = require("../utils/logger");
const { loadModules } = require("./moduleLoader");
const { createJobManager } = require("../modules/jobs");
const { createBrainLoop } = require("../modules/aiBrain");
const { createAutonomousMode } = require("../modules/autonomous");
const { createVillageBuilder } = require("../modules/villageBuilder");

function createRuntime() {
  const logger = createLogger();
  const modules = loadModules();

  const state = {
    bot: null,
    mcData: null,
    reconnecting: false,
    discordClient: null
  };

  function getBot() {
    return state.bot;
  }

  function getMcData() {
    return state.mcData;
  }

  const jobManager = createJobManager({
    bot: getBot,
    mcData: getMcData,
    actions: {
      chopWood: modules.woodcutting.chopWood,
      mineBlock: modules.mining.mineBlock,
      fishOnce: modules.fishing.fishOnce,
      farm: modules.farming.farm,
      autoSell: modules.economy.sellInventory
    },
    log: logger.log
  });

  const brain = createBrainLoop(getBot, modules, Number(process.env.BRAIN_INTERVAL_MS) || 10000);

  const autonomous = createAutonomousMode({
    bot: getBot,
    mcData: getMcData,
    modules,
    jobManager,
    brain,
    log: logger.log
  });

  const villageBuilder = createVillageBuilder({
    bot: getBot,
    modules,
    log: logger.log
  });

  function setBot(bot) {
    state.bot = bot;
  }

  function setMcData(mcData) {
    state.mcData = mcData;
  }

  return {
    state,
    modules,
    logger,
    jobManager,
    brain,
    autonomous,
    villageBuilder,
    getBot,
    getMcData,
    setBot,
    setMcData
  };
}

module.exports = { createRuntime };
