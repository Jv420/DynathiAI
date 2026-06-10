const { wait, isProtectedItem } = require("../utils/helpers");

const CATEGORIES = {
  wood: ["log", "planks", "stick", "wood", "sapling", "leaves"],
  stone: ["stone", "cobblestone", "deepslate", "granite", "diorite", "andesite", "tuff"],
  ores: ["ore", "coal", "iron", "copper", "gold", "diamond", "redstone", "lapis", "emerald"],
  food: ["bread", "apple", "beef", "porkchop", "chicken", "mutton", "carrot", "potato", "wheat", "melon", "cooked"],
  tools: ["pickaxe", "axe", "shovel", "sword", "hoe", "bow", "shield", "fishing_rod"],
  farming: ["seed", "wheat", "carrot", "potato", "beetroot", "sugar_cane", "pumpkin", "melon"],
  valuables: ["diamond", "emerald", "netherite", "gold", "iron", "lapis", "redstone"],
  building: ["fence", "chest", "crafting_table", "door", "stairs", "slab", "glass", "torch"]
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

function countCategory(bot, category) {
  const grouped = inventoryByCategory(bot);
  return (grouped[category] || []).reduce((sum, item) => sum + item.count, 0);
}

function supplyReport(bot) {
  const grouped = inventoryByCategory(bot);
  const wanted = { food: 32, wood: 64, stone: 128, building: 64, ores: 16 };
  const lines = Object.entries(wanted).map(([cat, min]) => {
    const total = (grouped[cat] || []).reduce((sum, item) => sum + item.count, 0);
    return `${cat}: ${total}/${min}${total < min ? " LOW" : " OK"}`;
  });
  return `📦 Supply report | ${lines.join(" | ")}`;
}

async function storeCategory(bot, storageModule, category = "misc") {
  if (!bot || !bot.entity) return false;
  if (!storageModule?.containerStoreMatching) return smartStore(bot, storageModule);
  return storageModule.containerStoreMatching(bot, storageModule.getChestNames(), `Warehouse ${category}`, itemName => getItemCategory(itemName) === category);
}

async function smartStore(bot, storageModule) {
  if (!bot || !bot.entity || !storageModule?.containerStore) return false;
  return storageModule.containerStore(bot, storageModule.getChestNames(), "Warehouse Chest");
}

async function takeCategory(bot, storageModule, category = "food", count = 64) {
  if (!bot || !bot.entity || !storageModule?.containerTakeMatching) return false;
  return storageModule.containerTakeMatching(bot, storageModule.getChestNames(), `Warehouse ${category}`, itemName => getItemCategory(itemName) === category, Number(count) || 64);
}

async function requestSupply(bot, storageModule, category = "food", count = 64) {
  const ok = await takeCategory(bot, storageModule, category, count);
  if (ok) bot.chat(`📦 Supply request gevuld: ${category} x${count}`);
  else bot.chat(`❌ Supply request mislukt: ${category}`);
  return ok;
}

async function sortInventory(bot, storageModule) {
  if (!bot || !bot.entity || !storageModule) return false;
  const order = ["food", "wood", "stone", "building", "ores", "farming", "misc"];
  let moved = 0;
  for (const category of order) {
    const ok = await storeCategory(bot, storageModule, category);
    if (ok) moved++;
    await wait(250);
  }
  bot.chat(`📦 Warehouse sort klaar: ${moved}/${order.length} categorieën verwerkt.`);
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

module.exports = { CATEGORIES, getItemCategory, inventoryByCategory, countCategory, supplyReport, storeCategory, smartStore, takeCategory, requestSupply, sortInventory, warehouseReport };
