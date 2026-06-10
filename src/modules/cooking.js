const { goals } = require("mineflayer-pathfinder");
const { wait } = require("../utils/helpers");

const RAW_FOODS = ["raw_beef", "raw_chicken", "raw_porkchop", "raw_mutton", "raw_cod", "raw_salmon", "potato"];
const FUELS = ["coal", "charcoal", "oak_log", "birch_log", "spruce_log", "jungle_log", "acacia_log", "dark_oak_log", "mangrove_log", "cherry_log", "oak_planks", "birch_planks", "spruce_planks", "jungle_planks", "acacia_planks", "dark_oak_planks"];

function findNearestFurnace(bot, maxDistance = 6) {
  return bot.findBlock({ matching: block => ["furnace", "blast_furnace", "smoker"].includes(block.name), maxDistance });
}

function findItem(bot, names) {
  return bot.inventory.items().find(item => names.includes(item.name));
}

async function openNearestFurnace(bot) {
  const block = findNearestFurnace(bot);
  if (!block) {
    bot.chat("❌ Geen furnace/smoker dichtbij gevonden.");
    return null;
  }
  bot.pathfinder.setGoal(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 2));
  await wait(1000);
  return bot.openFurnace(block);
}

async function cookFood(bot, amount = 8) {
  const raw = findItem(bot, RAW_FOODS);
  const fuel = findItem(bot, FUELS);
  if (!raw) { bot.chat("❌ Geen raw food gevonden om te koken."); return false; }
  if (!fuel) { bot.chat("❌ Geen fuel gevonden. Geef coal/charcoal/logs/planks."); return false; }

  let furnace = null;
  try {
    furnace = await openNearestFurnace(bot);
    if (!furnace) return false;
    const cookCount = Math.min(Number(amount) || 8, raw.count);
    await furnace.putInput(raw.type, null, cookCount);
    await wait(400);
    await furnace.putFuel(fuel.type, null, Math.min(fuel.count, Math.max(1, Math.ceil(cookCount / 8))));
    bot.chat(`🔥 Food cooking gestart: ${cookCount}x ${raw.name}.`);
    await wait(Math.min(30000, 12000 + cookCount * 1200));
    try { await furnace.takeOutput(); } catch {}
    bot.chat("✅ Cooking klaar, output gepakt als die klaar was.");
    return true;
  } catch (err) {
    bot.chat(`❌ Cooking fout: ${err.message}`);
    return false;
  } finally {
    try { if (furnace) furnace.close(); } catch {}
  }
}

module.exports = { cookFood, findNearestFurnace };
