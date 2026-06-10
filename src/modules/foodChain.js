const { wait } = require("../utils/helpers");

function countFood(bot) {
  if (!bot?.inventory) return 0;
  return bot.inventory.items()
    .filter(item => item.name.includes("bread") || item.name.includes("apple") || item.name.includes("cooked") || item.name.includes("beef") || item.name.includes("chicken") || item.name.includes("porkchop") || item.name.includes("mutton") || item.name.includes("carrot") || item.name.includes("potato"))
    .reduce((sum, item) => sum + item.count, 0);
}

function hasRawFood(bot) {
  return bot.inventory.items().some(item => item.name.startsWith("raw_") || item.name === "potato");
}

async function runFoodChain(bot, mcData, modules, options = {}) {
  if (!bot?.entity) return false;
  const minFood = Number(options.minFood) || 16;
  const foodCount = countFood(bot);

  if (foodCount >= minFood && bot.food > 14) return false;

  bot.chat(`🍖 FoodChain gestart: food ${foodCount}/${minFood}.`);

  if (modules.storage?.takeFood) {
    const took = await modules.storage.takeFood(bot, modules.storage.getChestNames(), "Farm/Warehouse Food", minFood - foodCount || 16);
    if (took) return true;
  }

  if (hasRawFood(bot) && modules.cooking?.cookFood) {
    const cooked = await modules.cooking.cookFood(bot, 8);
    if (cooked) {
      if (modules.storage?.storeFood) await modules.storage.storeFood(bot, modules.storage.getChestNames(), "Farm Food Storage");
      return true;
    }
  }

  if (modules.animals?.autoFoodProduction) {
    const animalFood = await modules.animals.autoFoodProduction(bot, modules);
    if (animalFood) return true;
  }

  if (modules.farming?.farm) {
    const farmed = await modules.farming.farm(bot, mcData, "wheat", 12);
    if (farmed && modules.storage?.storeFood) await modules.storage.storeFood(bot, modules.storage.getChestNames(), "Farm Food Storage");
    return farmed;
  }

  return false;
}

module.exports = { countFood, hasRawFood, runFoodChain };
