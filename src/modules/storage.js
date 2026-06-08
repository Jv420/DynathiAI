const { goals } = require("mineflayer-pathfinder");
const { wait, isProtectedItem } = require("../utils/helpers");

function findNearestContainer(bot, names, maxDistance = 5) {
  const positions = bot.findBlocks({
    matching: block => block && names.includes(block.name),
    maxDistance,
    count: 10
  });

  if (!positions.length) return null;

  const sorted = positions
    .map(pos => bot.blockAt(pos))
    .filter(Boolean)
    .sort((a, b) => a.position.distanceTo(bot.entity.position) - b.position.distanceTo(bot.entity.position));

  return sorted[0] || null;
}

async function openNearestContainer(bot, names, label = "Container") {
  const block = findNearestContainer(bot, names);

  if (!block) {
    bot.chat(`❌ Geen ${label} dichtbij gevonden.`);
    return null;
  }

  try {
    bot.pathfinder.setGoal(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 2));
    await wait(1000);
    return await bot.openContainer(block);
  } catch (err) {
    bot.chat(`❌ ${label} openen mislukt: ${err.message}`);
    return null;
  }
}

async function containerStore(bot, names, label = "Container") {
  const container = await openNearestContainer(bot, names, label);
  if (!container) return false;

  const items = bot.inventory.items().filter(item => !isProtectedItem(item));
  let moved = 0;

  for (const item of items) {
    try {
      await container.deposit(item.type, null, item.count);
      moved++;
      await wait(100);
    } catch (err) {
      console.log(`${label} store error:`, err.message);
    }
  }

  container.close();
  bot.chat(`📦 ${label} store klaar: ${moved} stacks opgeslagen.`);
  return moved > 0;
}

async function containerDump(bot, names, label = "Container") {
  const container = await openNearestContainer(bot, names, label);
  if (!container) return false;

  const items = container.containerItems();
  let moved = 0;

  for (const item of items) {
    try {
      await container.withdraw(item.type, null, item.count);
      moved++;
      await wait(100);
    } catch (err) {
      console.log(`${label} dump error:`, err.message);
    }
  }

  container.close();
  bot.chat(`📦 ${label} dump klaar: ${moved} stacks gepakt.`);
  return moved > 0;
}

async function containerTake(bot, names, label = "Container", itemName, count = 64) {
  if (!itemName) {
    bot.chat("Gebruik: take <item> <aantal>");
    return false;
  }

  const container = await openNearestContainer(bot, names, label);
  if (!container) return false;

  const item = container.containerItems().find(i => i.name.includes(itemName));

  if (!item) {
    container.close();
    bot.chat(`❌ ${itemName} niet gevonden in ${label}.`);
    return false;
  }

  const takeCount = Math.min(count || 64, item.count);

  try {
    await container.withdraw(item.type, null, takeCount);
    container.close();
    bot.chat(`📦 ${takeCount}x ${item.name} uit ${label} gepakt.`);
    return true;
  } catch (err) {
    container.close();
    bot.chat(`❌ Take mislukt: ${err.message}`);
    return false;
  }
}

function getChestNames() {
  return ["chest", "trapped_chest"];
}

function getShulkerNames(mcData) {
  return Object.keys(mcData.blocksByName).filter(name => name.includes("shulker_box"));
}

module.exports = {
  findNearestContainer,
  openNearestContainer,
  containerStore,
  containerDump,
  containerTake,
  getChestNames,
  getShulkerNames
};
