const { wait, isProtectedItem } = require("../utils/helpers");

const CATEGORIES = {
  wood: ["log", "planks", "stick", "wood", "sapling", "leaves"],
  stone: ["stone", "cobblestone", "deepslate", "granite", "diorite", "andesite", "tuff"],
  ores: ["ore", "coal", "iron", "copper", "gold", "diamond", "redstone", "lapis", "emerald"],
  food: ["bread", "apple", "beef", "porkchop", "chicken", "mutton", "carrot", "potato", "wheat", "melon"],
  tools: ["pickaxe", "axe", "shovel", "sword", "hoe", "bow", "shield", "fishing_rod"],
  farming: ["seed", "wheat", "carrot", "potato", "beetroot", "sugar_cane", "pumpkin", "melon"],
  valuables: ["diamond", "emerald", "netherite", "gold", "iron", "lapis", "redstone"]
};

function getItemCategory(itemName) {
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(keyword => itemName.includes(keyword))) return category;
  }
  return "misc";
}

function inventoryByCategory(bot) {
  const result = {};
  if (!bot || !bot.inventory) return result;

  for (const item of bot.inventory.items()) {
    const category = getItemCategory(item.name);
    if (!result[category]) result[category] = [];
    result[category].push({ name: item.name, count: item.count, slot: item.slot });
  }

  return result;
}

async function storeCategory(bot, storageModule, category = "misc") {
  if (!bot || !bot.entity) return false;

  const items = bot.inventory.items().filter(item =>
    !isProtectedItem(item) && getItemCategory(item.name) === category
  );

  if (!items.length) {
    bot.chat(`📦 Geen items gevonden voor categorie: ${category}`);
    return false;
  }

  const container = await storageModule.openNearestContainer(bot, storageModule.getChestNames(), "Warehouse Chest");
  if (!container) return false;

  let moved = 0;

  for (const item of items) {
    try {
      await container.deposit(item.type, null, item.count);
      moved++;
      await wait(100);
    } catch (err) {
      console.log("Warehouse store error:", err.message);
    }
  }

  container.close();
  bot.chat(`📦 Warehouse: ${moved} stacks opgeslagen als ${category}.`);
  return moved > 0;
}

async function smartStore(bot, storageModule) {
  if (!bot || !bot.entity) return false;

  const items = bot.inventory.items().filter(item => !isProtectedItem(item));
  if (!items.length) {
    bot.chat("📦 Geen items om op te slaan.");
    return false;
  }

  const container = await storageModule.openNearestContainer(bot, storageModule.getChestNames(), "Warehouse Chest");
  if (!container) return false;

  let moved = 0;

  for (const item of items) {
    try {
      await container.deposit(item.type, null, item.count);
      moved++;
      await wait(100);
    } catch (err) {
      console.log("Warehouse smart store error:", err.message);
    }
  }

  container.close();
  bot.chat(`📦 Smart warehouse store klaar: ${moved} stacks opgeslagen.`);
  return moved > 0;
}

function warehouseReport(bot) {
  const grouped = inventoryByCategory(bot);
  const lines = Object.entries(grouped).map(([category, items]) => {
    const total = items.reduce((sum, item) => sum + item.count, 0);
    return `${category}: ${items.length} stacks / ${total} items`;
  });

  return lines.length ? `📦 Warehouse report | ${lines.join(" | ")}` : "📦 Inventory is leeg.";
}

module.exports = {
  CATEGORIES,
  getItemCategory,
  inventoryByCategory,
  storeCategory,
  smartStore,
  warehouseReport
};
