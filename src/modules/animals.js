const { goals } = require("mineflayer-pathfinder");
const { wait } = require("../utils/helpers");

const ANIMAL_FOODS = {
  cow: ["wheat"], sheep: ["wheat"], goat: ["wheat"],
  pig: ["carrot", "potato", "beetroot"],
  chicken: ["wheat_seeds", "beetroot_seeds", "pumpkin_seeds", "melon_seeds"],
  horse: ["wheat", "apple", "golden_apple", "golden_carrot"],
  donkey: ["wheat", "apple", "golden_apple", "golden_carrot"],
  llama: ["wheat", "hay_block"], rabbit: ["carrot", "golden_carrot", "dandelion"]
};

const FOOD_ANIMALS = ["cow", "pig", "chicken", "sheep"];

function findAnimals(bot, animalType = "cow", maxDistance = 16) {
  if (!bot || !bot.entity) return [];
  return Object.values(bot.entities)
    .filter(entity => entity.type === "mob" && entity.name?.includes(animalType) && entity.position.distanceTo(bot.entity.position) <= maxDistance)
    .sort((a, b) => a.position.distanceTo(bot.entity.position) - b.position.distanceTo(bot.entity.position));
}

function findAnimal(bot, animalType = "cow", maxDistance = 16) {
  return findAnimals(bot, animalType, maxDistance)[0] || null;
}

function findAnimalFood(bot, animalType = "cow") {
  if (!bot || !bot.inventory) return null;
  const foods = ANIMAL_FOODS[animalType] || ["wheat"];
  return bot.inventory.items().find(item => foods.some(food => item.name.includes(food)));
}

async function goToAnimal(bot, animal) {
  if (!bot || !bot.entity || !animal) return false;
  try {
    bot.pathfinder.setGoal(new goals.GoalNear(animal.position.x, animal.position.y, animal.position.z, 2));
    await wait(1000 + Math.floor(Math.random() * 700));
    return true;
  } catch { return false; }
}

async function feedAnimal(bot, animalType = "cow") {
  if (!bot || !bot.entity) return false;
  const animal = findAnimal(bot, animalType);
  if (!animal) { bot.chat(`🐄 Geen ${animalType} dichtbij gevonden.`); return false; }
  const food = findAnimalFood(bot, animalType);
  if (!food) { bot.chat(`❌ Geen voer gevonden voor ${animalType}.`); return false; }
  try {
    await goToAnimal(bot, animal);
    await bot.equip(food, "hand");
    await bot.lookAt(animal.position.offset(0, 1, 0), true);
    bot.activateEntity(animal);
    bot.chat(`🐄 ${animalType} gevoerd met ${food.name}.`);
    return true;
  } catch (err) { bot.chat(`❌ Dier voeren mislukt: ${err.message}`); return false; }
}

async function breedAnimals(bot, animalType = "cow", amount = 2) {
  const animals = findAnimals(bot, animalType, 18).slice(0, Math.max(2, Number(amount) || 2));
  if (animals.length < 2) { bot.chat(`🐄 Te weinig ${animalType}s om te breeden.`); return false; }
  let fed = 0;
  for (const animal of animals) {
    const food = findAnimalFood(bot, animalType);
    if (!food) break;
    try {
      await goToAnimal(bot, animal);
      await bot.equip(food, "hand");
      await bot.lookAt(animal.position.offset(0, 1, 0), true);
      bot.activateEntity(animal);
      fed++;
      await wait(700 + Math.floor(Math.random() * 500));
    } catch {}
  }
  bot.chat(`🐄 Breeding klaar: ${fed}/${animals.length} ${animalType} gevoerd.`);
  return fed >= 2;
}

async function collectRawFood(bot, animalType = "cow", maxKills = 2) {
  if (!bot || !bot.entity) return false;
  const animals = findAnimals(bot, animalType, 16).slice(0, Number(maxKills) || 2);
  if (!animals.length) { bot.chat(`🥩 Geen ${animalType} gevonden voor food productie.`); return false; }
  let kills = 0;
  for (const animal of animals) {
    try {
      await goToAnimal(bot, animal);
      await bot.lookAt(animal.position.offset(0, 1, 0), true);
      bot.attack(animal);
      kills++;
      await wait(900);
    } catch {}
  }
  bot.chat(`🥩 Raw food productie: ${kills}/${animals.length} ${animalType} verwerkt.`);
  return kills > 0;
}

async function foodProduction(bot, modules, animalType = "cow") {
  const food = findAnimalFood(bot, animalType);
  const animals = findAnimals(bot, animalType, 18);
  if (food && animals.length >= 2) await breedAnimals(bot, animalType, 2);
  if (animals.length >= 4) await collectRawFood(bot, animalType, 1);
  if (modules?.cooking?.cookFood) await modules.cooking.cookFood(bot, 8);
  if (modules?.storage?.storeFood) await modules.storage.storeFood(bot, modules.storage.getChestNames(), "Farm Food Storage");
  return true;
}

async function autoFoodProduction(bot, modules) {
  for (const animalType of FOOD_ANIMALS) {
    const ok = await foodProduction(bot, modules, animalType);
    if (ok) return true;
  }
  return false;
}

module.exports = { ANIMAL_FOODS, FOOD_ANIMALS, findAnimals, findAnimal, findAnimalFood, goToAnimal, feedAnimal, breedAnimals, collectRawFood, foodProduction, autoFoodProduction };
