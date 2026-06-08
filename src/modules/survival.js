const { wait } = require("../utils/helpers");

const FOOD_KEYWORDS = [
  "bread",
  "apple",
  "beef",
  "steak",
  "porkchop",
  "chicken",
  "mutton",
  "rabbit",
  "carrot",
  "potato",
  "cooked",
  "cookie",
  "melon_slice",
  "pumpkin_pie"
];

function findFood(bot) {
  if (!bot || !bot.inventory) return null;
  return bot.inventory.items().find(item => FOOD_KEYWORDS.some(food => item.name.includes(food)));
}

async function eatFood(bot) {
  if (!bot || !bot.entity) return false;

  const food = findFood(bot);
  if (!food) {
    bot.chat("🍗 Ik heb geen eten.");
    return false;
  }

  try {
    await bot.equip(food, "hand");
    await bot.consume();
    bot.chat("🍗 Ik heb gegeten.");
    return true;
  } catch (err) {
    bot.chat("❌ Eten mislukt: " + err.message);
    return false;
  }
}

async function autoEat(bot, minFood = 14) {
  if (!bot || !bot.entity) return false;
  if (bot.food >= minFood) return false;
  return eatFood(bot);
}

function healthStatus(bot) {
  if (!bot || !bot.entity) return "❌ Bot is niet online.";

  const pos = bot.entity.position;
  return `❤️ Health: ${bot.health} | 🍗 Food: ${bot.food} | 📍 X:${Math.floor(pos.x)} Y:${Math.floor(pos.y)} Z:${Math.floor(pos.z)}`;
}

function setupDeathHandler(bot, log) {
  bot.on("death", () => {
    if (log) log("💀 DynathiAI is dood gegaan.");

    setTimeout(() => {
      if (bot && bot.entity) bot.chat("/spawn");
    }, 4000);
  });
}

async function antiAfkJump(bot) {
  if (!bot || !bot.entity) return false;

  bot.setControlState("jump", true);
  await wait(400);
  bot.setControlState("jump", false);
  return true;
}

module.exports = {
  FOOD_KEYWORDS,
  findFood,
  eatFood,
  autoEat,
  healthStatus,
  setupDeathHandler,
  antiAfkJump
};
