const { goals } = require("mineflayer-pathfinder");
const { Vec3 } = require("vec3");
const { wait } = require("../utils/helpers");

function findItem(bot, itemName) {
  if (!bot || !bot.inventory || !itemName) return null;
  return bot.inventory.items().find(item => item.name === itemName || item.name.includes(itemName));
}

function findNearbyItemFrame(bot, maxDistance = 5) {
  if (!bot || !bot.entity) return null;

  return bot.nearestEntity(entity =>
    entity.name === "item_frame" &&
    entity.position.distanceTo(bot.entity.position) <= maxDistance
  );
}

function findPlaceSurface(bot, maxDistance = 4) {
  if (!bot || !bot.entity) return null;

  const start = bot.entity.position.floored();
  const offsets = [
    new Vec3(1, 0, 0),
    new Vec3(-1, 0, 0),
    new Vec3(0, 0, 1),
    new Vec3(0, 0, -1),
    new Vec3(1, 1, 0),
    new Vec3(-1, 1, 0),
    new Vec3(0, 1, 1),
    new Vec3(0, 1, -1)
  ];

  for (let distance = 1; distance <= maxDistance; distance++) {
    for (const offset of offsets) {
      const pos = start.plus(offset.scaled(distance));
      const block = bot.blockAt(pos);
      const air = bot.blockAt(pos.plus(offset));

      if (block && block.name !== "air" && air && air.name === "air") {
        return { block, face: offset };
      }
    }
  }

  return null;
}

async function placeItemFrame(bot) {
  if (!bot || !bot.entity) return false;

  const itemFrame = findItem(bot, "item_frame");
  if (!itemFrame) {
    bot.chat("🖼️ Ik heb geen item_frame in mijn inventory.");
    return false;
  }

  const surface = findPlaceSurface(bot);
  if (!surface) {
    bot.chat("❌ Geen muur/surface gevonden om een itemframe te plaatsen.");
    return false;
  }

  try {
    await bot.equip(itemFrame, "hand");
    bot.pathfinder.setGoal(new goals.GoalNear(surface.block.position.x, surface.block.position.y, surface.block.position.z, 2));
    await wait(900);
    await bot.placeBlock(surface.block, surface.face);
    bot.chat("🖼️ Itemframe geplaatst.");
    return true;
  } catch (err) {
    bot.chat(`❌ Itemframe plaatsen mislukt: ${err.message}`);
    return false;
  }
}

async function putItemInFrame(bot, itemName) {
  if (!bot || !bot.entity) return false;

  const frame = findNearbyItemFrame(bot);
  if (!frame) {
    bot.chat("❌ Geen itemframe dichtbij gevonden.");
    return false;
  }

  const item = findItem(bot, itemName);
  if (!item) {
    bot.chat(`❌ Ik heb geen ${itemName} in mijn inventory.`);
    return false;
  }

  try {
    await bot.equip(item, "hand");
    await bot.lookAt(frame.position, true);
    bot.activateEntity(frame);
    bot.chat(`🖼️ ${item.name} in itemframe gezet.`);
    return true;
  } catch (err) {
    bot.chat(`❌ Item in frame zetten mislukt: ${err.message}`);
    return false;
  }
}

module.exports = {
  findItem,
  findNearbyItemFrame,
  findPlaceSurface,
  placeItemFrame,
  putItemInFrame
};
