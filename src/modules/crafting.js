const { goals } = require("mineflayer-pathfinder");
const { wait } = require("../utils/helpers");

function findCraftingTable(bot, maxDistance = 6) {
  if (!bot || !bot.entity) return null;

  const blocks = bot.findBlocks({
    matching: block => block && block.name === "crafting_table",
    maxDistance,
    count: 10
  });

  if (!blocks.length) return null;

  return blocks
    .map(pos => bot.blockAt(pos))
    .filter(Boolean)
    .sort((a, b) => a.position.distanceTo(bot.entity.position) - b.position.distanceTo(bot.entity.position))[0];
}

async function goToCraftingTable(bot) {
  const table = findCraftingTable(bot);
  if (!table) return null;

  try {
    bot.pathfinder.setGoal(new goals.GoalNear(table.position.x, table.position.y, table.position.z, 2));
    await wait(1200);
    return table;
  } catch {
    return table;
  }
}

function getRecipe(bot, mcData, itemName, useCraftingTable = false) {
  const item = mcData.itemsByName[itemName];
  if (!item) return null;

  const table = useCraftingTable ? findCraftingTable(bot) : null;
  const recipes = bot.recipesFor(item.id, null, 1, table);

  return recipes && recipes.length ? recipes[0] : null;
}

async function craftItem(bot, mcData, itemName, count = 1, useCraftingTable = false) {
  if (!bot || !bot.entity) return false;
  if (!mcData) {
    bot.chat("Bot is nog niet klaar.");
    return false;
  }

  const item = mcData.itemsByName[itemName];
  if (!item) {
    bot.chat(`❌ Item onbekend: ${itemName}`);
    return false;
  }

  let table = null;
  if (useCraftingTable) {
    table = await goToCraftingTable(bot);
    if (!table) {
      bot.chat("❌ Geen crafting table dichtbij gevonden.");
      return false;
    }
  }

  const recipe = bot.recipesFor(item.id, null, 1, table)[0];
  if (!recipe) {
    bot.chat(`❌ Geen recipe gevonden voor ${itemName}.`);
    return false;
  }

  try {
    await bot.craft(recipe, count, table);
    bot.chat(`🧰 Gecraft: ${count}x ${itemName}`);
    return true;
  } catch (err) {
    bot.chat(`❌ Craften mislukt: ${err.message}`);
    return false;
  }
}

async function craftQuick(bot, mcData, itemName, count = 1) {
  const tableItems = [
    "chest",
    "furnace",
    "stone_pickaxe",
    "iron_pickaxe",
    "diamond_pickaxe",
    "stone_axe",
    "iron_axe",
    "diamond_axe",
    "shield"
  ];

  const needsTable = tableItems.includes(itemName);
  return craftItem(bot, mcData, itemName, count, needsTable);
}

module.exports = {
  findCraftingTable,
  goToCraftingTable,
  getRecipe,
  craftItem,
  craftQuick
};
