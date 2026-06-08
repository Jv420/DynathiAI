function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isProtectedItem(item) {
  if (!item || !item.name) return true;
  const name = item.name;

  return name.includes("pickaxe") ||
    name.includes("axe") ||
    name.includes("shovel") ||
    name.includes("sword") ||
    name.includes("bow") ||
    name.includes("crossbow") ||
    name.includes("helmet") ||
    name.includes("chestplate") ||
    name.includes("leggings") ||
    name.includes("boots") ||
    name.includes("diamond") ||
    name.includes("netherite") ||
    name.includes("emerald") ||
    name.includes("elytra") ||
    name.includes("trident") ||
    name.includes("shield") ||
    name.includes("totem") ||
    name.includes("fishing_rod");
}

async function waitForWindow(bot, timeoutMs = 6000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (bot.currentWindow) return bot.currentWindow;
    await wait(200);
  }

  return null;
}

module.exports = {
  wait,
  isProtectedItem,
  waitForWindow
};
