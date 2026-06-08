const { goals } = require("mineflayer-pathfinder");
const { wait } = require("../utils/helpers");

const ANIMAL_FOODS = {
  cow: ["wheat"],
  sheep: ["wheat"],
  goat: ["wheat"],
  pig: ["carrot", "potato", "beetroot"],
  chicken: ["wheat_seeds", "beetroot_seeds", "pumpkin_seeds", "melon_seeds"],
  horse: ["wheat", "apple", "golden_apple", "golden_carrot"],
  donkey: ["wheat", "apple", "golden_apple", "golden_carrot"],
  llama: ["wheat", "hay_block"],
  rabbit: ["carrot", "golden_carrot", "dandelion"]
};

function findAnimal(bot, animalType = "cow", maxDistance = 16) {
  if (!bot || !bot.entity) return null;

  return bot.nearestEntity(entity =>
    entity.type === "mob" &&
    entity.name?.includes(animalType) &&
    entity.position.distanceTo(bot.entity.position) <= maxDistance
  );
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
    await wait(1200);
    return true;
  } catch {
    return false;
  }
}

async function feedAnimal(bot, animalType = "cow") {
  if (!bot || !bot.entity) return false;

  const animal = findAnimal(bot, animalType);
  if (!animal) {
    bot.chat(`🐄 Geen ${animalType} dichtbij gevonden.`);
    return false;
  }

  const food = findAnimalFood(bot, animalType);
  if (!food) {
    bot.chat(`❌ Geen voer gevonden voor ${animalType}.`);
    return false;
  }

  try {
    await goToAnimal(bot, animal);
    await bot.equip(food, "hand");
    await bot.lookAt(animal.position.offset(0, 1, 0), true);
    bot.activateEntity(animal);
    bot.chat(`🐄 ${animalType} gevoerd met ${food.name}.`);
    return true;
  } catch (err) {
    bot.chat(`❌ Dier voeren mislukt: ${err.message}`);
    return false;
  }
}

async function breedAnimals(bot, animalType = "cow", amount = 2) {
  let fed = 0;

  for (let i = 0; i < amount; i++) {
    const ok = await feedAnimal(bot, animalType);
    if (ok) fed++;
    await wait(700);
  }

  bot.chat(`🐄 Breeding klaar: ${fed}/${amount} ${animalType} gevoerd.`);
  return fed >= 2;
}

module.exports = {
  ANIMAL_FOODS,
  findAnimal,
  findAnimalFood,
  goToAnimal,
  feedAnimal,
  breedAnimals
};
