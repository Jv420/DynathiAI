function findNearestMob(bot, maxDistance = 6) {
  if (!bot || !bot.entity) return null;

  return bot.nearestEntity(entity =>
    entity.type === "mob" &&
    entity.position.distanceTo(bot.entity.position) <= maxDistance
  );
}

function findHostileMob(bot, maxDistance = 8) {
  if (!bot || !bot.entity) return null;

  const hostileNames = [
    "zombie",
    "skeleton",
    "spider",
    "creeper",
    "witch",
    "enderman",
    "drowned",
    "husk",
    "stray",
    "phantom",
    "slime",
    "magma_cube",
    "pillager",
    "vindicator",
    "evoker",
    "ravager"
  ];

  return bot.nearestEntity(entity =>
    entity.type === "mob" &&
    hostileNames.some(name => entity.name?.includes(name)) &&
    entity.position.distanceTo(bot.entity.position) <= maxDistance
  );
}

async function attackNearestMob(bot, maxDistance = 6) {
  const mob = findNearestMob(bot, maxDistance);

  if (!mob) {
    bot.chat("Geen mob dichtbij.");
    return false;
  }

  try {
    await bot.lookAt(mob.position.offset(0, 1, 0));
    bot.attack(mob);
    bot.chat("⚔️ Mob aangevallen.");
    return true;
  } catch (err) {
    bot.chat("❌ Attack mislukt: " + err.message);
    return false;
  }
}

async function guardTick(bot, maxDistance = 5) {
  const mob = findHostileMob(bot, maxDistance) || findNearestMob(bot, maxDistance);
  if (!mob) return false;

  try {
    await bot.lookAt(mob.position.offset(0, 1, 0));
    bot.attack(mob);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  findNearestMob,
  findHostileMob,
  attackNearestMob,
  guardTick
};
