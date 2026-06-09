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

function createSmartBrain({ bot, mcData, modules, jobManager, autonomous, villageBuilder, log }) {
  const state = {
    enabled: false,
    busy: false,
    cycles: 0,
    lastAction: "idle",
    loop: null
  };

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
        state.lastAction = "low_health_eat_or_stop";
        currentBot.chat("🧠 Lage health gedetecteerd. Ik speel veilig.");
        if (jobManager) jobManager.stop(false);
        if (autonomous) autonomous.stop();
        if (villageBuilder) villageBuilder.stop();
        if (modules.survival?.eatFood) await modules.survival.eatFood(currentBot);
        return true;
      }

      if (snap.food <= 12) {
        state.lastAction = "eat_food";
        if (modules.survival?.eatFood) await modules.survival.eatFood(currentBot);
        return true;
      }

      if (snap.emptySlots <= 2) {
        state.lastAction = "store_inventory";
        if (modules.storage?.containerStore) {
          await modules.storage.containerStore(currentBot, modules.storage.getChestNames(), "Chest");
        }
        return true;
      }

      if (!snap.hasPickaxe && modules.crafting?.craftQuick) {
        state.lastAction = "craft_pickaxe";
        await modules.crafting.craftQuick(currentBot, currentMcData, "stone_pickaxe", 1);
        return true;
      }

      if (!snap.hasAxe && modules.crafting?.craftQuick) {
        state.lastAction = "craft_axe";
        await modules.crafting.craftQuick(currentBot, currentMcData, "stone_axe", 1);
        return true;
      }

      if (!snap.hasFood && modules.farming?.farm) {
        state.lastAction = "farm_food";
        await modules.farming.farm(currentBot, currentMcData, "wheat", 10);
        return true;
      }

      if (jobManager && !jobManager.state.enabled) {
        state.lastAction = "start_wood_job";
        jobManager.start("wood", "logs");
        return true;
      }

      state.lastAction = "idle_ok";
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
