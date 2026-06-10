const { wait, isProtectedItem } = require("../utils/helpers");

const CATEGORIES = {
  wood: ["log", "planks", "stick", "wood", "sapling", "leaves"],
  stone: ["stone", "cobblestone", "deepslate", "granite", "diorite", "andesite", "tuff"],
  ores: ["ore", "coal", "iron", "copper", "gold", "diamond", "redstone", "lapis", "emerald"],
  food: ["bread", "apple", "beef", "porkchop", "chicken", "mutton", "carrot", "potato", "wheat", "melon", "cooked"],
  tools: ["pickaxe", "axe", "shovel", "sword", "hoe", "bow", "shield", "fishing_rod"],
  farming: ["seed", "wheat", "carrot", "potato", "beetroot", "sugar_cane", "pumpkin", "melon"],
  valuables: ["diamond", "emerald", "netherite", "gold", "iron", "lapis", "redstone"],
  building: ["fence", "chest", "crafting_table", "door", "stairs", "slab", "glass", "torch", "cobblestone"]
};

const ROUTES = {
  food: ["farm", "warehouse", "home"],
  wood: ["lumberyard", "warehouse", "home"],
  stone: ["mine", "warehouse", "home"],
  building: ["warehouse", "lumberyard", "mine", "home"],
  ores: ["mine", "warehouse", "home"],
  farming: ["farm", "warehouse", "home"],
  misc: ["warehouse", "home"]
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

async function goWaypoint(bot, modules, name) {
  if (!name || !modules?.waypoints?.goToWaypoint) return false;
  try {
    await modules.waypoints.goToWaypoint(bot, name);
    await wait(900);
    return true;
  } catch {
    return false;
  }
}

async function scanNearestChest(bot, storageModule, label = "Warehouse") {
  if (!storageModule?.openNearestContainer) return null;
  return storageModule.openNearestContainer(bot, storageModule.getChestNames(), label);
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

async function storeCategory(bot, storageModule, category = "misc", modules = null) {
  if (!bot || !bot.entity || !storageModule?.containerStoreMatching) return false;
  const routes = modules ? (ROUTES[category] || ROUTES.misc) : [null];
  for (const waypoint of routes) {
    if (waypoint) await goWaypoint(bot, modules, waypoint);
    const ok = await storageModule.containerStoreMatching(bot, storageModule.getChestNames(), waypoint || `Warehouse ${category}`, itemName => getItemCategory(itemName) === category);
    if (ok) return true;
    await wait(300);
  }
  return false;
}

async function smartStore(bot, storageModule, modules = null) {
  if (!bot || !bot.entity || !storageModule?.containerStore) return false;
  if (modules?.waypoints?.goToWaypoint) await goWaypoint(bot, modules, "warehouse");
  return storageModule.containerStore(bot, storageModule.getChestNames(), "Warehouse Chest");
}

async function takeCategory(bot, storageModule, category = "food", count = 64, modules = null) {
  if (!bot || !bot.entity || !storageModule?.containerTakeMatching) return false;
  const routes = modules ? (ROUTES[category] || ROUTES.misc) : [null];
  for (const waypoint of routes) {
    if (waypoint) await goWaypoint(bot, modules, waypoint);
    const ok = await storageModule.containerTakeMatching(bot, storageModule.getChestNames(), waypoint || `Warehouse ${category}`, itemName => getItemCategory(itemName) === category, Number(count) || 64);
    if (ok) return true;
    await wait(300);
  }
  return false;
}

async function requestSupply(bot, storageModule, category = "food", count = 64, modules = null) {
  const ok = await takeCategory(bot, storageModule, category, count, modules);
  if (ok) bot.chat(`📦 Supply request gevuld: ${category} x${count}`);
  else bot.chat(`❌ Supply request mislukt: ${category}`);
  return ok;
}

async function sortInventory(bot, storageModule, modules = null) {
  if (!bot || !bot.entity || !storageModule) return false;
  const order = ["food", "wood", "stone", "building", "ores", "farming", "misc"];
  let moved = 0;
  for (const category of order) {
    const ok = await storeCategory(bot, storageModule, category, modules);
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

module.exports = { CATEGORIES, ROUTES, getItemCategory, inventoryByCategory, countCategory, supplyReport, scanNearestChest, storeCategory, smartStore, takeCategory, requestSupply, sortInventory, warehouseReport };
