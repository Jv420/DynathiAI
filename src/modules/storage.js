const { goals } = require("mineflayer-pathfinder");
const { wait, isProtectedItem } = require("../utils/helpers");

let storageBusy = false;

function findNearestContainer(bot, names, maxDistance = 5) {
  if (!bot || !bot.entity) return null;

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
    await wait(1200);

    const freshBlock = bot.blockAt(block.position);
    if (!freshBlock || !names.includes(freshBlock.name)) {
      bot.chat(`❌ ${label} is niet meer geldig of niet geladen.`);
      return null;
    }

    return await bot.openContainer(freshBlock);
  } catch (err) {
    bot.chat(`❌ ${label} openen mislukt: ${err.message}`);
    return null;
  }
}

async function containerStore(bot, names, label = "Container") {
  if (storageBusy) {
    bot.chat(`⏳ ${label} opslag is al bezig.`);
    return false;
  }

  storageBusy = true;
  let container = null;

  try {
    container = await openNearestContainer(bot, names, label);
    if (!container) return false;

    const items = bot.inventory.items()
      .filter(Boolean)
      .filter(item => item.type && item.count > 0)
      .filter(item => !isProtectedItem(item));

    let moved = 0;

    for (const item of items) {
      if (!bot || !bot.entity || !container) break;
      const stillHasItem = bot.inventory.items().find(i => i && i.type === item.type);
      if (!stillHasItem) continue;

      try {
        await container.deposit(stillHasItem.type, null, stillHasItem.count);
        moved++;
        await wait(150);
      } catch (err) {
        const msg = err?.message || "unknown";
        if (!msg.includes("Can't find") && !msg.includes("invalid operation")) {
          console.log(`${label} store error:`, msg);
        }
      }
    }

    bot.chat(`📦 ${label} store klaar: ${moved} stacks opgeslagen.`);
    return moved > 0;
  } catch (err) {
    console.log(`${label} store fatal:`, err.message);
    return false;
  } finally {
    try { if (container) container.close(); } catch {}
    storageBusy = false;
  }
}

async function containerDump(bot, names, label = "Container") {
  if (storageBusy) {
    bot.chat(`⏳ ${label} opslag is al bezig.`);
    return false;
  }

  storageBusy = true;
  let container = null;

  try {
    container = await openNearestContainer(bot, names, label);
    if (!container) return false;

    const items = container.containerItems().filter(Boolean);
    let moved = 0;

    for (const item of items) {
      if (!bot || !bot.entity || !container) break;
      try {
        await container.withdraw(item.type, null, item.count);
        moved++;
        await wait(150);
      } catch (err) {
        console.log(`${label} dump error:`, err.message);
      }
    }

    bot.chat(`📦 ${label} dump klaar: ${moved} stacks gepakt.`);
    return moved > 0;
  } finally {
    try { if (container) container.close(); } catch {}
    storageBusy = false;
  }
}

async function containerTake(bot, names, label = "Container", itemName, count = 64) {
  if (!itemName) {
    bot.chat("Gebruik: take <item> <aantal>");
    return false;
  }

  let container = null;

  try {
    container = await openNearestContainer(bot, names, label);
    if (!container) return false;

    const item = container.containerItems().filter(Boolean).find(i => i.name.includes(itemName));

    if (!item) {
      bot.chat(`❌ ${itemName} niet gevonden in ${label}.`);
      return false;
    }

    const takeCount = Math.min(count || 64, item.count);
    await container.withdraw(item.type, null, takeCount);
    bot.chat(`📦 ${takeCount}x ${item.name} uit ${label} gepakt.`);
    return true;
  } catch (err) {
    bot.chat(`❌ Take mislukt: ${err.message}`);
    return false;
  } finally {
    try { if (container) container.close(); } catch {}
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
