const { goals } = require("mineflayer-pathfinder");
const { wait } = require("../utils/helpers");

function findBestMiningTool(bot) {
  return bot.inventory.items().find(item =>
    item.name.includes("pickaxe") ||
    item.name.includes("shovel") ||
    item.name.includes("axe")
  );
}

async function mineBlock(bot, mcData, blockName = "stone", amount = 1) {
  if (!bot || !bot.entity) return false;
  if (!mcData) {
    bot.chat("Bot is nog niet klaar.");
    return false;
  }

  const blockType = mcData.blocksByName[blockName];
  if (!blockType) {
    bot.chat(`Dat block ken ik niet: ${blockName}`);
    return false;
  }

  const positions = bot.findBlocks({
    matching: blockType.id,
    maxDistance: 64,
    count: amount
  });

  if (!positions.length) {
    bot.chat(`❌ Ik zie geen ${blockName} dichtbij.`);
    return false;
  }

  const tool = findBestMiningTool(bot);
  if (tool) {
    try {
      await bot.equip(tool, "hand");
    } catch {}
  }

  bot.chat(`⛏️ Ik ga ${positions.length}x ${blockName} minen.`);

  let mined = 0;

  for (const pos of positions) {
    if (!bot || !bot.entity) break;

    const block = bot.blockAt(pos);
    if (!block || block.name !== blockName) continue;

    try {
      bot.pathfinder.setGoal(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 1));
      await wait(1700);

      const freshBlock = bot.blockAt(block.position);
      if (!freshBlock || freshBlock.name !== blockName) continue;

      await bot.lookAt(freshBlock.position.offset(0.5, 0.5, 0.5), true);
      await bot.dig(freshBlock);
      mined++;
      await wait(300);
    } catch (err) {
      console.log("Mining error:", err.message);
    }
  }

  bot.pathfinder.setGoal(null);

  if (mined > 0) {
    bot.chat(`✅ Klaar met minen: ${mined}x ${blockName}.`);
    return true;
  }

  bot.chat(`❌ Geen ${blockName} kunnen minen.`);
  return false;
}

module.exports = {
  mineBlock,
  findBestMiningTool
};
