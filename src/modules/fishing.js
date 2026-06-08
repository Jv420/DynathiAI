const { wait } = require("../utils/helpers");

function findFishingRod(bot) {
  return bot.inventory.items().find(item => item.name.includes("fishing_rod"));
}

async function fishOnce(bot) {
  if (!bot || !bot.entity) return false;

  const rod = findFishingRod(bot);
  if (!rod) {
    bot.chat("🎣 Ik heb geen fishing rod.");
    return false;
  }

  try {
    await bot.equip(rod, "hand");
    bot.chat("🎣 Ik ga vissen...");
    await bot.fish();
    await wait(500);
    bot.chat("🐟 Visactie klaar.");
    return true;
  } catch (err) {
    bot.chat("❌ Vissen mislukt: " + err.message);
    return false;
  }
}

async function fishLoop(bot, amount = 5) {
  let caught = 0;

  for (let i = 0; i < amount; i++) {
    if (!bot || !bot.entity) break;

    const ok = await fishOnce(bot);
    if (ok) caught++;

    await wait(1000);
  }

  bot.chat(`🎣 Fishing loop klaar: ${caught}/${amount} acties gelukt.`);
  return caught > 0;
}

module.exports = {
  findFishingRod,
  fishOnce,
  fishLoop
};
