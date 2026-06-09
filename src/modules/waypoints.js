const fs = require("fs");
const path = require("path");
const { goals } = require("mineflayer-pathfinder");

const DATA_DIR = path.join(process.cwd(), "data");
const WAYPOINT_FILE = path.join(DATA_DIR, "waypoints.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(WAYPOINT_FILE)) fs.writeFileSync(WAYPOINT_FILE, JSON.stringify({}, null, 2));
}

function loadWaypoints() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(WAYPOINT_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveWaypoints(waypoints) {
  ensureDataFile();
  fs.writeFileSync(WAYPOINT_FILE, JSON.stringify(waypoints, null, 2));
}

function normalizeName(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

function setWaypoint(bot, name) {
  if (!bot || !bot.entity) return false;

  const key = normalizeName(name);
  if (!key) {
    bot.chat("Gebruik: waypoint set <naam>");
    return false;
  }

  const pos = bot.entity.position.floored();
  const waypoints = loadWaypoints();

  waypoints[key] = {
    name: key,
    x: pos.x,
    y: pos.y,
    z: pos.z,
    createdAt: new Date().toISOString()
  };

  saveWaypoints(waypoints);
  bot.chat(`📍 Waypoint opgeslagen: ${key} = X:${pos.x} Y:${pos.y} Z:${pos.z}`);
  return true;
}

function getWaypoint(name) {
  const key = normalizeName(name);
  const waypoints = loadWaypoints();
  return waypoints[key] || null;
}

function listWaypoints() {
  const waypoints = loadWaypoints();
  return Object.keys(waypoints);
}

function removeWaypoint(bot, name) {
  const key = normalizeName(name);
  const waypoints = loadWaypoints();

  if (!waypoints[key]) {
    bot.chat(`❌ Waypoint niet gevonden: ${key}`);
    return false;
  }

  delete waypoints[key];
  saveWaypoints(waypoints);
  bot.chat(`🗑️ Waypoint verwijderd: ${key}`);
  return true;
}

async function goToWaypoint(bot, name, range = 2) {
  if (!bot || !bot.entity) return false;

  const wp = getWaypoint(name);
  if (!wp) {
    bot.chat(`❌ Waypoint niet gevonden: ${name}`);
    return false;
  }

  try {
    bot.chat(`🧭 Ik ga naar waypoint ${wp.name}: X:${wp.x} Y:${wp.y} Z:${wp.z}`);
    bot.pathfinder.setGoal(new goals.GoalNear(wp.x, wp.y, wp.z, range));
    return true;
  } catch (err) {
    bot.chat(`❌ Waypoint navigatie mislukt: ${err.message}`);
    return false;
  }
}

function waypointReport() {
  const waypoints = loadWaypoints();
  const names = Object.keys(waypoints);

  if (!names.length) return "📍 Geen waypoints opgeslagen.";

  return "📍 Waypoints: " + names.map(name => {
    const wp = waypoints[name];
    return `${name}(X:${wp.x} Y:${wp.y} Z:${wp.z})`;
  }).join(" | ");
}

module.exports = {
  loadWaypoints,
  saveWaypoints,
  setWaypoint,
  getWaypoint,
  listWaypoints,
  removeWaypoint,
  goToWaypoint,
  waypointReport
};
