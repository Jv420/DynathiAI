const { goals } = require("mineflayer-pathfinder");
const { Vec3 } = require("vec3");
const { wait } = require("../utils/helpers");

function randomOffset(radius = 40) {
  const x = Math.floor((Math.random() * radius * 2) - radius);
  const z = Math.floor((Math.random() * radius * 2) - radius);
  return new Vec3(x, 0, z);
}

function findInterestingBlock(bot, names, maxDistance = 64) {
  if (!bot || !bot.entity) return null;

  const positions = bot.findBlocks({
    matching: block => block && names.some(name => block.name.includes(name)),
    maxDistance,
    count: 30
  });

  if (!positions.length) return null;

  return positions
    .map(pos => bot.blockAt(pos))
    .filter(Boolean)
    .sort((a, b) => a.position.distanceTo(bot.entity.position) - b.position.distanceTo(bot.entity.position))[0];
}

async function exploreRandom(bot, radius = 40) {
  if (!bot || !bot.entity) return false;

  const start = bot.entity.position.floored();
  const target = start.plus(randomOffset(radius));

  try {
    bot.chat(`🗺️ Ik ga verkennen naar X:${target.x} Z:${target.z}`);
    bot.pathfinder.setGoal(new goals.GoalNear(target.x, start.y, target.z, 4));
    return true;
  } catch (err) {
    bot.chat(`❌ Explore mislukt: ${err.message}`);
    return false;
  }
}

async function exploreFor(bot, type = "forest") {
  if (!bot || !bot.entity) return false;

  const targets = {
    forest: ["log", "leaves"],
    cave: ["stone", "deepslate", "coal_ore", "iron_ore"],
    water: ["water"],
    village: ["bell", "hay_block", "composter", "lectern", "bed"],
    farm: ["wheat", "carrots", "potatoes", "beetroots"],
    chest: ["chest", "barrel"],
    ore: ["coal_ore", "iron_ore", "copper_ore", "gold_ore", "diamond_ore"]
  };

  const names = targets[type] || targets.forest;
  const block = findInterestingBlock(bot, names, 80);

  if (!block) {
    bot.chat(`🗺️ Geen ${type} dichtbij gevonden. Ik verken random verder.`);
    return exploreRandom(bot, 50);
  }

  try {
    bot.chat(`🗺️ ${type} gevonden bij X:${block.position.x} Y:${block.position.y} Z:${block.position.z}`);
    bot.pathfinder.setGoal(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 4));
    await wait(1000);
    return true;
  } catch (err) {
    bot.chat(`❌ Explore target mislukt: ${err.message}`);
    return false;
  }
}

function createExplorerLoop(botGetter, intervalMs = 30000) {
  const state = {
    enabled: false,
    type: "random",
    loop: null,
    cycles: 0
  };

  async function tick() {
    const bot = botGetter();
    if (!state.enabled || !bot || !bot.entity) return;

    state.cycles++;
    if (state.type === "random") await exploreRandom(bot, 50);
    else await exploreFor(bot, state.type);
  }

  function start(type = "random") {
    const bot = botGetter();
    if (state.loop) clearInterval(state.loop);

    state.enabled = true;
    state.type = type;
    state.cycles = 0;
    state.loop = setInterval(tick, intervalMs);

    if (bot) bot.chat(`🗺️ Explorer gestart: ${type}`);
    tick();
    return true;
  }

  function stop() {
    const bot = botGetter();
    state.enabled = false;
    if (state.loop) clearInterval(state.loop);
    state.loop = null;
    if (bot) bot.chat("🛑 Explorer gestopt.");
    return true;
  }

  function status() {
    return `🗺️ Explorer: ${state.enabled ? "aan" : "uit"} | Type: ${state.type} | Cycles: ${state.cycles}`;
  }

  return { state, start, stop, status, tick };
}

module.exports = {
  randomOffset,
  findInterestingBlock,
  exploreRandom,
  exploreFor,
  createExplorerLoop
};
