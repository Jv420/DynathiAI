const { goals } = require("mineflayer-pathfinder");
const { wait } = require("../utils/helpers");

const FARM_TYPES = {
  wheat: {
    crop: "wheat",
    seed: "wheat_seeds",
    age: 7
  },
  carrot: {
    crop: "carrots",
    seed: "carrot",
    age: 7
  },
  potato: {
    crop: "potatoes",
    seed: "potato",
    age: 7
  },
  beetroot: {
    crop: "beetroots",
    seed: "beetroot_seeds",
    age: 3
  },
  sugar_cane: {
    crop: "sugar_cane",
    seed: "sugar_cane",
    age: null
  },
  melon: {
    crop: "melon",
    seed: null,
    age: null
  },
  pumpkin: {
    crop: "pumpkin",
    seed: null,
    age: null
  }
};

function isMatureCrop(block, farmInfo) {
  if (!block || block.name !== farmInfo.crop) return false;

  if (farmInfo.age === null) return true;

  const age = block.getProperties?.().age;
  return Number(age) >= farmInfo.age;
}

function isAir(block) {
  return !block || block.name === "air" || block.name === "cave_air" || block.name === "void_air";
}

function isValidSoil(block) {
  if (!block) return false;
  return block.name === "farmland" || block.name === "dirt" || block.name === "grass_block";
}

function findSeed(bot, seedName) {
  if (!seedName) return null;
  return bot.inventory.items().find(item => item.name === seedName || item.name.includes(seedName));
}

async function replantCrop(bot, oldCropBlock, farmInfo) {
  if (!farmInfo.seed) return false;

  const seed = findSeed(bot, farmInfo.seed);
  if (!seed) {
    bot.chat(`🌾 Geen ${farmInfo.seed} gevonden om opnieuw te planten.`);
    return false;
  }

  try {
    const cropPos = oldCropBlock.position;
    const currentBlock = bot.blockAt(cropPos);
    const below = bot.blockAt(cropPos.offset(0, -1, 0));

    if (!isAir(currentBlock)) return false;
    if (!isValidSoil(below)) return false;

    await bot.equip(seed, "hand");
    await wait(250);

    await Promise.race([
      bot.placeBlock(below, { x: 0, y: 1, z: 0 }),
      wait(2500).then(() => false)
    ]);

    await wait(350);
    const planted = bot.blockAt(cropPos);
    return planted && planted.name === farmInfo.crop;
  } catch (err) {
    console.log("Replant skipped:", err.message);
    return false;
  }
}

async function farm(bot, mcData, farmType = "wheat", amount = 20) {
  if (!bot || !bot.entity) return false;
  if (!mcData) {
    bot.chat("Bot is nog niet klaar.");
    return false;
  }

  const farmInfo = FARM_TYPES[farmType];
  if (!farmInfo) {
    bot.chat(`❌ Farm type onbekend: ${farmType}`);
    bot.chat(`Beschikbaar: ${Object.keys(FARM_TYPES).join(", ")}`);
    return false;
  }

  const blockType = mcData.blocksByName[farmInfo.crop];
  if (!blockType) {
    bot.chat(`❌ Crop niet gevonden in deze versie: ${farmInfo.crop}`);
    return false;
  }

  const positions = bot.findBlocks({
    matching: blockType.id,
    maxDistance: 48,
    count: amount * 2
  });

  if (!positions.length) {
    bot.chat(`❌ Geen ${farmType} farm dichtbij gevonden.`);
    return false;
  }

  const matureBlocks = positions
    .map(pos => bot.blockAt(pos))
    .filter(block => isMatureCrop(block, farmInfo))
    .slice(0, amount);

  if (!matureBlocks.length) {
    bot.chat(`🌾 Geen rijpe ${farmType} gevonden.`);
    return false;
  }

  bot.chat(`🌾 Ik ga ${matureBlocks.length}x ${farmType} farmen.`);

  let harvested = 0;
  let replanted = 0;

  for (const block of matureBlocks) {
    if (!bot || !bot.entity) break;

    try {
      bot.pathfinder.setGoal(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 1));
      await wait(1200);

      const freshBlock = bot.blockAt(block.position);
      if (!isMatureCrop(freshBlock, farmInfo)) continue;

      await bot.lookAt(freshBlock.position.offset(0.5, 0.5, 0.5), true);
      await bot.dig(freshBlock, true);
      harvested++;
      await wait(500);

      if (await replantCrop(bot, freshBlock, farmInfo)) replanted++;
      await wait(250);
    } catch (err) {
      console.log("Farm error:", err.message);
    }
  }

  bot.pathfinder.setGoal(null);
  bot.chat(`🌾 Farm klaar: ${harvested} geoogst, ${replanted} opnieuw geplant.`);
  return harvested > 0;
}

module.exports = {
  FARM_TYPES,
  farm,
  isMatureCrop,
  replantCrop
};
