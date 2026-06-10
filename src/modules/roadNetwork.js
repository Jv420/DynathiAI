const { Vec3 } = require("vec3");
const { goals } = require("mineflayer-pathfinder");
const { wait } = require("../utils/helpers");

function getWaypoint(modules, name) {
  const all = modules.waypoints?.state?.waypoints || modules.waypoints?.waypoints || {};
  return all[name] || null;
}

function linePoints(a, b) {
  const points = [];
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const steps = Math.max(Math.abs(dx), Math.abs(dz));
  if (steps <= 0) return [new Vec3(a.x, a.y, a.z)];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push(new Vec3(Math.round(a.x + dx * t), a.y, Math.round(a.z + dz * t)));
  }
  return points;
}

async function placeBlock(bot, mcData, pos, blockName = "cobblestone") {
  const item = bot.inventory.items().find(i => i.name === blockName || i.name.includes(blockName));
  if (!item) return false;
  const below = bot.blockAt(pos.offset(0, -1, 0));
  const target = bot.blockAt(pos);
  if (!below || !target) return false;
  if (target.name !== "air" && !target.name.includes("grass") && !target.name.includes("snow")) return false;
  try {
    await bot.equip(item, "hand");
    bot.pathfinder.setGoal(new goals.GoalNear(pos.x, pos.y, pos.z, 2));
    await wait(900 + Math.floor(Math.random() * 600));
    await bot.placeBlock(below, new Vec3(0, 1, 0));
    await wait(250 + Math.floor(Math.random() * 350));
    return true;
  } catch {
    return false;
  }
}

async function buildRoad(bot, mcData, modules, fromName, toName, blockName = "cobblestone") {
  const from = getWaypoint(modules, fromName);
  const to = getWaypoint(modules, toName);
  if (!from || !to) {
    bot.chat(`❌ Road: waypoint mist (${fromName} -> ${toName}).`);
    return false;
  }
  bot.chat(`🛣️ Road bouwen: ${fromName} -> ${toName}`);
  const points = linePoints(from, to);
  let placed = 0;
  for (const p of points) {
    const pos = new Vec3(p.x, p.y, p.z);
    const ok = await placeBlock(bot, mcData, pos, blockName);
    if (ok) placed++;
    if (placed > 0 && placed % 16 === 0) bot.chat(`🛣️ Road progress: ${placed} blocks.`);
  }
  bot.chat(`✅ Road klaar: ${fromName} -> ${toName} (${placed} blocks geplaatst).`);
  return placed > 0;
}

async function buildNetwork(bot, mcData, modules, blockName = "cobblestone") {
  const routes = [
    ["home", "warehouse"],
    ["warehouse", "farm"],
    ["warehouse", "mine"],
    ["warehouse", "lumberyard"],
    ["warehouse", "outpost"]
  ];
  let done = 0;
  for (const [a, b] of routes) {
    const ok = await buildRoad(bot, mcData, modules, a, b, blockName);
    if (ok) done++;
    await wait(1000);
  }
  bot.chat(`🛣️ Road network klaar: ${done}/${routes.length} routes gebouwd.`);
  return done > 0;
}

module.exports = { buildRoad, buildNetwork };
