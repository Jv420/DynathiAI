const { goals } = require("mineflayer-pathfinder");
const { wait } = require("../utils/helpers");

const LOG_NAMES = [
  "oak_log",
  "birch_log",
  "spruce_log",
  "jungle_log",
  "acacia_log",
  "dark_oak_log",
  "mangrove_log",
  "cherry_log"
];

async function chopWood(bot, mcData, amount = 10) {
  if (!bot || !bot.entity) return false;
  if (!mcData) {
    bot.chat("Bot is nog niet klaar.");
    return false;
  }

  const ids = LOG_NAMES.map(name => mcData.blocksByName[name]?.id).filter(Boolean);
  const positions = bot.findBlocks({ matching: ids, maxDistance: 64, count: amount });

  if (!positions.length) {
    bot.chat("❌ Ik zie geen hout dichtbij.");
    return false;
  }

  const axe = bot.inventory.items().find(i => i.name.includes("axe"));
  if (axe) {
    try {
      await bot.equip(axe, "hand");
    } catch {}
  }

  bot.chat(`🪓 Ik ga ${positions.length} logs hakken.`);

  let chopped = 0;
  for (const pos of positions) {
    if (!bot || !bot.entity) break;

    const block = bot.blockAt(pos);
    if (!block || !LOG_NAMES.includes(block.name)) continue;

    try {
      bot.pathfinder.setGoal(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 1));
      await wait(1700);

      const freshBlock = bot.blockAt(block.position);
      if (!freshBlock || !LOG_NAMES.includes(freshBlock.name)) continue;

      await bot.lookAt(freshBlock.position.offset(0.5, 0.5, 0.5), true);
      await bot.dig(freshBlock);
      chopped++;
      await wait(300);
    } catch (err) {
      console.log("Woodcutting error:", err.message);
    }
  }

  bot.pathfinder.setGoal(null);

  if (chopped > 0) {
    bot.chat(`✅ Klaar met hout hakken: ${chopped} logs.`);
    return true;
  }

  bot.chat("❌ Geen logs kunnen hakken.");
  return false;
}

module.exports = {
  chopWood,
  LOG_NAMES
};
