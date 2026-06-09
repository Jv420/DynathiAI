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
    low_health_eat_or_stop: 20000,
    eat_food: 15000,
    store_inventory: 30000,
    craft_pickaxe: 60000,
    craft_axe: 60000,
    farm_food: 45000,
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
    cooldowns: createCooldowns()
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

  async function decideAndAct() {
    const currentBot = bot();
    const currentMcData = mcData();
    if (!state.enabled || state.busy || !currentBot || !currentBot.entity) return false;

    state.busy = true;
    state.cycles++;

    try {
      const snap = getSnapshot(currentBot);
      if (!snap) return false;

      if (snap.health <= 10) {
        return runAction("low_health_eat_or_stop", async () => {
          currentBot.chat("🧠 Lage health gedetecteerd. Ik speel veilig.");
          if (jobManager) jobManager.stop(false);
          if (autonomous) autonomous.stop();
          if (villageBuilder) villageBuilder.stop();
          if (modules.survival?.eatFood) await modules.survival.eatFood(currentBot);
        });
      }

      if (snap.food <= 12) {
        return runAction("eat_food", async () => {
          if (modules.survival?.eatFood) await modules.survival.eatFood(currentBot);
        });
      }

      if (snap.emptySlots <= 2) {
        return runAction("store_inventory", async () => {
          if (modules.storage?.containerStore) {
            await modules.storage.containerStore(currentBot, modules.storage.getChestNames(), "Chest");
          }
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
        return runAction("farm_food", async () => {
          await modules.farming.farm(currentBot, currentMcData, "wheat", 10);
        });
      }

      if (jobManager && !jobManager.state.enabled) {
        return runAction("start_wood_job", async () => {
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
    if (currentBot) currentBot.chat("🧠 SmartBrain V2 gestart.");
    decideAndAct().catch(() => {});
    return true;
  }

  function stop() {
    state.enabled = false;
    if (state.loop) clearInterval(state.loop);
    state.loop = null;
    const currentBot = bot();
    if (currentBot) currentBot.chat("🧠 SmartBrain V2 gestopt.");
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
      `Health: ${snap.health}`,
      `Food: ${snap.food}`,
      `Empty slots: ${snap.emptySlots}`,
      `Pickaxe: ${snap.hasPickaxe ? "ja" : "nee"}`,
      `Axe: ${snap.hasAxe ? "ja" : "nee"}`,
      `Food item: ${snap.hasFood ? "ja" : "nee"}`
    ].join(" | ");
  }

  return {
    state,
    start,
    stop,
    status,
    tick: decideAndAct,
    getSnapshot
  };
}

module.exports = { createSmartBrain };
