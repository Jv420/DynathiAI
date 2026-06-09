const { Vec3 } = require("vec3");
const { goals } = require("mineflayer-pathfinder");
const { wait } = require("../utils/helpers");

function getBlockItem(bot, blockName) {
  return bot.inventory.items().find(item => item.name === blockName);
}

function countItem(bot, blockName) {
  return bot.inventory.items()
    .filter(item => item.name === blockName)
    .reduce((total, item) => total + item.count, 0);
}

async function moveNear(bot, pos) {
  bot.pathfinder.setGoal(new goals.GoalNear(pos.x, pos.y, pos.z, 2));
  await wait(450);
}

function isAir(block) {
  return !block || block.name === "air" || block.name === "cave_air" || block.name === "void_air";
}

async function placeBlockAt(bot, blockName, targetPos) {
  const item = getBlockItem(bot, blockName);
  if (!item) return false;

  const existing = bot.blockAt(targetPos);
  if (!isAir(existing)) return false;

  const below = targetPos.offset(0, -1, 0);
  const referenceBlock = bot.blockAt(below);
  if (isAir(referenceBlock)) return false;

  try {
    await bot.equip(item, "hand");
    await moveNear(bot, targetPos);
    await bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
    await wait(120);
    return true;
  } catch {
    return false;
  }
}

async function buildPlatform(bot, blockName = "oak_planks", width = 9, depth = 9) {
  if (!bot || !bot.entity) return false;
  width = Math.max(3, Math.min(Number(width) || 9, 21));
  depth = Math.max(3, Math.min(Number(depth) || 9, 21));

  const needed = width * depth;
  const available = countItem(bot, blockName);
  if (available < needed) {
    bot.chat(`🏠 Te weinig ${blockName}. Nodig: ${needed}, beschikbaar: ${available}`);
    return false;
  }

  const start = bot.entity.position.floored();
  const y = start.y;
  let placed = 0;
  bot.chat(`🏗️ Platform bouwen: ${width}x${depth} met ${blockName}`);

  const halfW = Math.floor(width / 2);
  const halfD = Math.floor(depth / 2);
  for (let x = -halfW; x < width - halfW; x++) {
    for (let z = -halfD; z < depth - halfD; z++) {
      const ok = await placeBlockAt(bot, blockName, new Vec3(start.x + x, y, start.z + z));
      if (ok) placed++;
    }
  }

  bot.chat(`✅ Platform klaar: ${placed}/${needed} blocks geplaatst.`);
  return true;
}

async function buildHut(bot, blockName = "oak_planks", size = 7, height = 4) {
  if (!bot || !bot.entity) return false;
  size = Math.max(5, Math.min(Number(size) || 7, 13));
  height = Math.max(3, Math.min(Number(height) || 4, 8));

  const needed = (size * size) + (size * 4 * height) + (size * size);
  const available = countItem(bot, blockName);
  if (available < Math.floor(needed * 0.55)) {
    bot.chat(`🏠 Waarschuwing: mogelijk te weinig ${blockName}. Aanbevolen: ${needed}, beschikbaar: ${available}`);
  }

  const start = bot.entity.position.floored();
  const y = start.y;
  const half = Math.floor(size / 2);
  let placed = 0;
  bot.chat(`🏠 Starter hut bouwen: ${size}x${size}x${height} met ${blockName}`);

  for (let x = -half; x <= half; x++) {
    for (let z = -half; z <= half; z++) {
      const ok = await placeBlockAt(bot, blockName, new Vec3(start.x + x, y, start.z + z));
      if (ok) placed++;
    }
  }

  for (let layer = 1; layer <= height; layer++) {
    for (let x = -half; x <= half; x++) {
      for (let z = -half; z <= half; z++) {
        const isWall = x === -half || x === half || z === -half || z === half;
        if (!isWall) continue;
        const isDoor = z === -half && x === 0 && (layer === 1 || layer === 2);
        const isWindow = layer === 2 && ((Math.abs(x) === half && z === 0) || (Math.abs(z) === half && x === 0));
        if (isDoor || isWindow) continue;
        const ok = await placeBlockAt(bot, blockName, new Vec3(start.x + x, y + layer, start.z + z));
        if (ok) placed++;
      }
    }
  }

  for (let x = -half; x <= half; x++) {
    for (let z = -half; z <= half; z++) {
      const ok = await placeBlockAt(bot, blockName, new Vec3(start.x + x, y + height + 1, start.z + z));
      if (ok) placed++;
    }
  }

  bot.chat(`✅ Starter hut klaar. Blocks geplaatst: ${placed}.`);
  return true;
}

async function buildFarmPlot(bot, blockName = "oak_planks", size = 9) {
  if (!bot || !bot.entity) return false;
  size = Math.max(5, Math.min(Number(size) || 9, 21));
  const start = bot.entity.position.floored();
  const y = start.y;
  const half = Math.floor(size / 2);
  let placed = 0;

  bot.chat(`🌾 Farm plot bouwen: ${size}x${size} met rand van ${blockName}`);

  for (let x = -half; x <= half; x++) {
    for (let z = -half; z <= half; z++) {
      const edge = x === -half || x === half || z === -half || z === half;
      const waterLine = x === 0 && Math.abs(z) < half;
      const block = edge ? blockName : waterLine ? "water_bucket" : null;
      if (!block) continue;
      if (block === "water_bucket") continue;
      const ok = await placeBlockAt(bot, blockName, new Vec3(start.x + x, y, start.z + z));
      if (ok) placed++;
    }
  }

  bot.chat(`✅ Farm plot rand klaar. Blocks geplaatst: ${placed}. Maak water in het midden en hoe de grond.`);
  return true;
}

async function buildAnimalPen(bot, blockName = "oak_fence", size = 9) {
  if (!bot || !bot.entity) return false;
  size = Math.max(5, Math.min(Number(size) || 9, 21));
  const start = bot.entity.position.floored();
  const y = start.y;
  const half = Math.floor(size / 2);
  let placed = 0;

  bot.chat(`🐄 Animal pen bouwen: ${size}x${size} met ${blockName}`);

  for (let x = -half; x <= half; x++) {
    for (let z = -half; z <= half; z++) {
      const edge = x === -half || x === half || z === -half || z === half;
      const gateOpening = z === -half && x === 0;
      if (!edge || gateOpening) continue;
      const ok = await placeBlockAt(bot, blockName, new Vec3(start.x + x, y, start.z + z));
      if (ok) placed++;
    }
  }

  bot.chat(`✅ Animal pen klaar. Blocks geplaatst: ${placed}. Plaats eventueel zelf nog een fence gate.`);
  return true;
}

async function buildWatchtower(bot, blockName = "oak_planks", height = 8) {
  if (!bot || !bot.entity) return false;
  height = Math.max(5, Math.min(Number(height) || 8, 16));
  const start = bot.entity.position.floored();
  const y = start.y;
  let placed = 0;

  bot.chat(`🗼 Watchtower bouwen met ${blockName}, hoogte ${height}`);

  for (let layer = 0; layer < height; layer++) {
    const corners = [
      new Vec3(start.x - 1, y + layer, start.z - 1),
      new Vec3(start.x + 1, y + layer, start.z - 1),
      new Vec3(start.x - 1, y + layer, start.z + 1),
      new Vec3(start.x + 1, y + layer, start.z + 1)
    ];
    for (const pos of corners) {
      const ok = await placeBlockAt(bot, blockName, pos);
      if (ok) placed++;
    }
  }

  for (let x = -2; x <= 2; x++) {
    for (let z = -2; z <= 2; z++) {
      const ok = await placeBlockAt(bot, blockName, new Vec3(start.x + x, y + height, start.z + z));
      if (ok) placed++;
    }
  }

  bot.chat(`✅ Watchtower klaar. Blocks geplaatst: ${placed}.`);
  return true;
}

async function buildStarterBase(bot, blockName = "oak_planks") {
  return buildHut(bot, blockName, 7, 4);
}

function baseHelp() {
  return "Gebruik: base platform <block> <width> <depth> | base hut <block> <size> <height> | base starter <block> | base farm <block> <size> | base pen <fence> <size> | base tower <block> <height>";
}

module.exports = {
  buildPlatform,
  buildHut,
  buildStarterBase,
  buildFarmPlot,
  buildAnimalPen,
  buildWatchtower,
  baseHelp
};
