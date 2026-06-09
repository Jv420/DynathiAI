const mining = require("../modules/mining");
const woodcutting = require("../modules/woodcutting");
const fishing = require("../modules/fishing");
const storage = require("../modules/storage");
const farming = require("../modules/farming");
const combat = require("../modules/combat");
const survival = require("../modules/survival");
const crafting = require("../modules/crafting");
const building = require("../modules/building");
const itemframes = require("../modules/itemframes");
const sleep = require("../modules/sleep");
const aiBrain = require("../modules/aiBrain");
const animals = require("../modules/animals");
const economy = require("../modules/economy");
const navigation = require("../modules/navigation");
const autonomous = require("../modules/autonomous");
const explorer = require("../modules/explorer");

function loadModules() {
  return {
    mining,
    woodcutting,
    fishing,
    storage,
    farming,
    combat,
    survival,
    crafting,
    building,
    itemframes,
    sleep,
    aiBrain,
    animals,
    economy,
    navigation,
    autonomous,
    explorer
  };
}

module.exports = { loadModules };
