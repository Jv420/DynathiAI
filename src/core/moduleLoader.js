const mining = require("../modules/mining");
const woodcutting = require("../modules/woodcutting");
const fishing = require("../modules/fishing");
const storage = require("../modules/storage");
const farming = require("../modules/farming");
const combat = require("../modules/combat");
const survival = require("../modules/survival");
const crafting = require("../modules/crafting");
const building = require("../modules/building");
const baseBuilder = require("../modules/baseBuilder");
const villageBuilder = require("../modules/villageBuilder");
const smartBrain = require("../modules/smartBrain");
const smartBrainV8 = require("../modules/smartBrainV8");
const itemframes = require("../modules/itemframes");
const sleep = require("../modules/sleep");
const aiBrain = require("../modules/aiBrain");
const animals = require("../modules/animals");
const economy = require("../modules/economy");
const navigation = require("../modules/navigation");
const autonomous = require("../modules/autonomous");
const explorer = require("../modules/explorer");
const warehouseAI = require("../modules/warehouseAI");
const auctionAI = require("../modules/auctionAI");
const waypoints = require("../modules/waypoints");
const cooking = require("../modules/cooking");
const roadNetwork = require("../modules/roadNetwork");
const foodChain = require("../modules/foodChain");

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
    baseBuilder,
    villageBuilder,
    smartBrain,
    smartBrainV8,
    itemframes,
    sleep,
    aiBrain,
    animals,
    economy,
    navigation,
    autonomous,
    explorer,
    warehouseAI,
    auctionAI,
    waypoints,
    cooking,
    roadNetwork,
    foodChain
  };
}

module.exports = { loadModules };
