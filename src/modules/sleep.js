const { goals } = require("mineflayer-pathfinder");
const { wait } = require("../utils/helpers");

function isNight(bot) {
  if (!bot || !bot.time) return false;
  return bot.time.isNight || bot.time.timeOfDay >= 12541;
}

function findNearestBed(bot, maxDistance = 12) {
  if (!bot || !bot.entity) return null;

  const beds = bot.findBlocks({
    matching: block => block && block.name.includes("bed"),
    maxDistance,
    count: 20
  });

  if (!beds.length) return null;

  return beds
    .map(pos => bot.blockAt(pos))
    .filter(Boolean)
    .sort((a, b) => a.position.distanceTo(bot.entity.position) - b.position.distanceTo(bot.entity.position))[0];
}

async function goToBed(bot, bed) {
  if (!bot || !bot.entity || !bed) return false;

  try {
    bot.pathfinder.setGoal(new goals.GoalNear(bed.position.x, bed.position.y, bed.position.z, 2));
    await wait(1200);
    return true;
  } catch {
    return false;
  }
}

async function sleepInNearestBed(bot, force = false) {
  if (!bot || !bot.entity) return false;

  if (!force && !isNight(bot)) {
    bot.chat("🛏️ Het is nog geen nacht.");
    return false;
  }

  const bed = findNearestBed(bot);
  if (!bed) {
    bot.chat("❌ Geen bed dichtbij gevonden.");
    return false;
  }

  try {
    await goToBed(bot, bed);
    await bot.sleep(bed);
    bot.chat("🛏️ Ik slaap nu.");
    return true;
  } catch (err) {
    bot.chat(`❌ Slapen mislukt: ${err.message}`);
    return false;
  }
}

async function wakeUp(bot) {
  if (!bot || !bot.entity) return false;

  try {
    await bot.wake();
    bot.chat("☀️ Ik ben wakker.");
    return true;
  } catch (err) {
    bot.chat(`❌ Wakker worden mislukt: ${err.message}`);
    return false;
  }
}

module.exports = {
  isNight,
  findNearestBed,
  goToBed,
  sleepInNearestBed,
  wakeUp
};
