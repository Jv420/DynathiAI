const { goals } = require("mineflayer-pathfinder");
const { Vec3 } = require("vec3");
const { wait } = require("../utils/helpers");

async function goToCoords(bot, x, y, z, range = 2) {
  if (!bot || !bot.entity) return false;

  const tx = Number(x);
  const ty = Number(y);
  const tz = Number(z);

  if ([tx, ty, tz].some(Number.isNaN)) {
    bot.chat("🧭 Gebruik: goto <x> <y> <z>");
    return false;
  }

  try {
    bot.chat(`🧭 Ik loop naar X:${tx} Y:${ty} Z:${tz}`);
    bot.pathfinder.setGoal(new goals.GoalNear(tx, ty, tz, range));
    return true;
  } catch (err) {
    bot.chat(`❌ Navigatie mislukt: ${err.message}`);
    return false;
  }
}

async function goToPlayer(bot, playerName, range = 2) {
  if (!bot || !bot.entity) return false;

  const player = bot.players[playerName]?.entity;
  if (!player) {
    bot.chat(`❌ Speler niet gevonden: ${playerName}`);
    return false;
  }

  try {
    bot.chat(`🧭 Ik loop naar ${playerName}.`);
    bot.pathfinder.setGoal(new goals.GoalFollow(player, range), true);
    return true;
  } catch (err) {
    bot.chat(`❌ Follow mislukt: ${err.message}`);
    return false;
  }
}

async function goToEntity(bot, entity, range = 2) {
  if (!bot || !bot.entity || !entity) return false;

  try {
    bot.pathfinder.setGoal(new goals.GoalNear(entity.position.x, entity.position.y, entity.position.z, range));
    await wait(1000);
    return true;
  } catch {
    return false;
  }
}

async function goToBlock(bot, block, range = 2) {
  if (!bot || !bot.entity || !block) return false;

  try {
    bot.pathfinder.setGoal(new goals.GoalNear(block.position.x, block.position.y, block.position.z, range));
    await wait(1000);
    return true;
  } catch {
    return false;
  }
}

function distanceTo(bot, x, y, z) {
  if (!bot || !bot.entity) return Infinity;
  return bot.entity.position.distanceTo(new Vec3(Number(x), Number(y), Number(z)));
}

function stopNavigation(bot) {
  if (!bot || !bot.pathfinder) return false;
  bot.pathfinder.setGoal(null);
  bot.clearControlStates();
  bot.chat("🛑 Navigatie gestopt.");
  return true;
}

module.exports = {
  goToCoords,
  goToPlayer,
  goToEntity,
  goToBlock,
  distanceTo,
  stopNavigation
};
