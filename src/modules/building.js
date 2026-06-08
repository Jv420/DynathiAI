const { goals } = require("mineflayer-pathfinder");
const { Vec3 } = require("vec3");
const { wait } = require("../utils/helpers");

function findBuildItem(bot, blockName) {
  if (!bot || !bot.inventory) return null;
  return bot.inventory.items().find(item => item.name === blockName || item.name.includes(blockName));
}

async function placeBlockAt(bot, blockName, targetPos) {
  if (!bot || !bot.entity) return false;

  const item = findBuildItem(bot, blockName);
  if (!item) {
    bot.chat(`🏠 Ik heb geen ${blockName} in mijn inventory.`);
    return false;
  }

  const below = bot.blockAt(targetPos.offset(0, -1, 0));
  if (!below || below.name === "air") {
    bot.chat("❌ Geen block onder de bouwplek gevonden.");
    return false;
  }

  try {
    await bot.equip(item, "hand");
    bot.pathfinder.setGoal(new goals.GoalNear(targetPos.x, targetPos.y, targetPos.z, 3));
    await wait(900);
    await bot.placeBlock(below, new Vec3(0, 1, 0));
    return true;
  } catch (err) {
    bot.chat(`❌ Block plaatsen mislukt: ${err.message}`);
    return false;
  }
}

async function buildFloor(bot, blockName = "oak_planks", width = 3, length = 3) {
  if (!bot || !bot.entity) return false;

  const start = bot.entity.position.floored().offset(1, 0, 1);
  let placed = 0;

  bot.chat(`🏠 Ik bouw een vloer van ${width}x${length} met ${blockName}.`);

  for (let x = 0; x < width; x++) {
    for (let z = 0; z < length; z++) {
      const pos = start.offset(x, 0, z);
      const ok = await placeBlockAt(bot, blockName, pos);
      if (ok) placed++;
      await wait(250);
    }
  }

  bot.pathfinder.setGoal(null);
  bot.chat(`🏠 Vloer klaar: ${placed}/${width * length} blocks geplaatst.`);
  return placed > 0;
}

async function buildWall(bot, blockName = "oak_planks", width = 5, height = 3) {
  if (!bot || !bot.entity) return false;

  const start = bot.entity.position.floored().offset(1, 1, 0);
  let placed = 0;

  bot.chat(`🧱 Ik bouw een muur van ${width}x${height} met ${blockName}.`);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = start.offset(x, y, 0);
      const ok = await placeBlockAt(bot, blockName, pos);
      if (ok) placed++;
      await wait(250);
    }
  }

  bot.pathfinder.setGoal(null);
  bot.chat(`🧱 Muur klaar: ${placed}/${width * height} blocks geplaatst.`);
  return placed > 0;
}

module.exports = {
  findBuildItem,
  placeBlockAt,
  buildFloor,
  buildWall
};
