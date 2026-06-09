async function handleCommand({ bot, mcData, args, modules, jobManager, brain, autonomous, villageBuilder, smartBrain, reply }) {
  const command = (args[0] || "help").toLowerCase();
  const sub = (args[1] || "").toLowerCase();

  if (command === "help") {
    reply("🤖 DynathiAI commands: mine, chop, fish, farm, chest, shulker, craft, build, base, village, smart, goto, waypoint, warehouse, explore, auto, follow, stop, attack, guard, eat, status, sleep, brain, job, balance, sell, shop, ah");
    return true;
  }

  if (command === "smart") {
    if (!smartBrain) return reply("❌ SmartBrain controller is niet geladen.");
    if (sub === "start") return smartBrain.start();
    if (sub === "stop") return smartBrain.stop();
    if (sub === "status" || !sub) return reply(smartBrain.status());
    if (sub === "tick") return smartBrain.tick();
    if (sub === "home") return smartBrain.setHome(args[2] || "home");
    if (sub === "warehouse" || sub === "wh") return smartBrain.setWarehouse(args[2] || "warehouse");
    if (sub === "farm") return smartBrain.setFarm(args[2] || "farm");
    if (sub === "mine") return smartBrain.setMine(args[2] || "mine");
    if (sub === "lumber" || sub === "lumberyard") return smartBrain.setLumber(args[2] || "lumberyard");
    if (sub === "colony") {
      const action = (args[2] || "status").toLowerCase();
      if (action === "on" || action === "start") return smartBrain.colonyOn();
      if (action === "off" || action === "stop") return smartBrain.colonyOff();
      return reply(smartBrain.colonyStatus());
    }
    if (sub === "expansion" || sub === "expand") {
      const action = (args[2] || "status").toLowerCase();
      if (action === "on" || action === "start") return smartBrain.expansionOn();
      if (action === "off" || action === "stop") return smartBrain.expansionOff();
      return reply(smartBrain.colonyStatus());
    }
    reply("Gebruik: smart start | smart stop | smart status | smart tick | smart home <waypoint> | smart warehouse <waypoint> | smart farm <waypoint> | smart mine <waypoint> | smart lumber <waypoint> | smart colony on/off/status | smart expansion on/off/status");
    return false;
  }

  if (command === "mine") return modules.mining.mineBlock(bot, mcData, args[1] || "stone", Number(args[2]) || 1);
  if (command === "chop" || command === "wood") return modules.woodcutting.chopWood(bot, mcData, Number(args[1]) || 10);
  if (command === "fish") return modules.fishing.fishOnce(bot);
  if (command === "farm") return modules.farming.farm(bot, mcData, args[1] || "wheat", Number(args[2]) || 20);

  if (command === "village") {
    if (!villageBuilder) return reply("❌ VillageBuilder controller is niet geladen.");
    if (sub === "start") return villageBuilder.start(args[2] || "oak_planks");
    if (sub === "stop") return villageBuilder.stop();
    if (sub === "status" || !sub) return reply(villageBuilder.status());
    reply("Gebruik: village start <block> | village stop | village status");
    return false;
  }

  if (command === "chest") {
    const names = modules.storage.getChestNames();
    if (sub === "store") return modules.storage.containerStore(bot, names, "Chest");
    if (sub === "dump") return modules.storage.containerDump(bot, names, "Chest");
    if (sub === "take") return modules.storage.containerTake(bot, names, "Chest", args[2], Number(args[3]) || 64);
  }

  if (command === "shulker") {
    const names = modules.storage.getShulkerNames(mcData);
    if (sub === "store") return modules.storage.containerStore(bot, names, "Shulker");
    if (sub === "dump") return modules.storage.containerDump(bot, names, "Shulker");
    if (sub === "take") return modules.storage.containerTake(bot, names, "Shulker", args[2], Number(args[3]) || 64);
  }

  if (command === "warehouse" || command === "wh") {
    if (!modules.warehouseAI) return reply("❌ WarehouseAI module is niet geladen.");
    if (sub === "report" || sub === "status") return reply(modules.warehouseAI.warehouseReport(bot).slice(0, 1900));
    if (sub === "store") return modules.warehouseAI.smartStore(bot, modules.storage);
    if (sub === "storecat" || sub === "category") return modules.warehouseAI.storeCategory(bot, modules.storage, args[2] || "misc");
    if (sub === "build") {
      if (!modules.baseBuilder?.buildWarehouse) return reply("❌ Warehouse Builder is niet geladen.");
      return modules.baseBuilder.buildWarehouse(bot, args[2] || "oak_planks", Number(args[3]) || 11, Number(args[4]) || 5);
    }
    reply("Gebruik: warehouse report | store | storecat <categorie> | build <block> <size> <height>");
    return false;
  }

  if (command === "explore") {
    if (!modules.explorer) return reply("❌ Explorer module is niet geladen.");
    const target = sub || "random";
    return target === "random" ? modules.explorer.exploreRandom(bot, 50) : modules.explorer.exploreFor(bot, target);
  }

  if (command === "auto" || command === "autonomous") {
    if (!autonomous) return reply("❌ Autonomous controller is niet geladen.");
    if (sub === "start") return autonomous.start();
    if (sub === "stop") return autonomous.stop();
    if (sub === "status" || !sub) return reply(autonomous.status());
    reply("Gebruik: auto start | auto stop | auto status");
    return false;
  }

  if (command === "craft") return modules.crafting.craftQuick(bot, mcData, args[1], Number(args[2]) || 1);

  if (command === "build") {
    if (sub === "floor") return modules.building.buildFloor(bot, args[2] || "oak_planks", Number(args[3]) || 3, Number(args[4]) || 3);
    if (sub === "wall") return modules.building.buildWall(bot, args[2] || "oak_planks", Number(args[3]) || 5, Number(args[4]) || 3);
  }

  if (command === "base") {
    if (!modules.baseBuilder) return reply("❌ BaseBuilder module is niet geladen.");
    if (sub === "starter" || sub === "small") return modules.baseBuilder.buildStarterBase(bot, args[2] || "oak_planks");
    if (sub === "hut" || sub === "house") return modules.baseBuilder.buildHut(bot, args[2] || "oak_planks", Number(args[3]) || 7, Number(args[4]) || 4);
    if (sub === "platform") return modules.baseBuilder.buildPlatform(bot, args[2] || "oak_planks", Number(args[3]) || 9, Number(args[4]) || 9);
    if (sub === "warehouse" || sub === "storehouse") return modules.baseBuilder.buildWarehouse(bot, args[2] || "oak_planks", Number(args[3]) || 11, Number(args[4]) || 5);
    if (sub === "farm" || sub === "farmplot") return modules.baseBuilder.buildFarmPlot(bot, args[2] || "oak_planks", Number(args[3]) || 9);
    if (sub === "pen" || sub === "animalpen") return modules.baseBuilder.buildAnimalPen(bot, args[2] || "oak_fence", Number(args[3]) || 9);
    if (sub === "tower" || sub === "watchtower") return modules.baseBuilder.buildWatchtower(bot, args[2] || "oak_planks", Number(args[3]) || 8);
    reply(modules.baseBuilder.baseHelp());
    return false;
  }

  if (command === "waypoint" || command === "wp") {
    if (!modules.waypoints) return reply("❌ Waypoints module is niet geladen.");
    if (sub === "set") return modules.waypoints.setWaypoint(bot, args[2]);
    if (sub === "list") return reply(modules.waypoints.waypointReport().slice(0, 1900));
    if (sub === "remove" || sub === "delete") return modules.waypoints.removeWaypoint(bot, args[2]);
    if (sub === "goto") return modules.waypoints.goToWaypoint(bot, args[2]);
    reply("Gebruik: waypoint set <naam> | list | goto <naam> | remove <naam>");
    return false;
  }

  if (command === "goto") {
    if (modules.waypoints && args[1] && !args[2] && !args[3]) return modules.waypoints.goToWaypoint(bot, args[1]);
    return modules.navigation.goToCoords(bot, args[1], args[2], args[3]);
  }

  if (command === "follow") return modules.navigation.goToPlayer(bot, args[1] || process.env.OWNER_NAME || "", 2);

  if (command === "stop") {
    modules.navigation.stopNavigation(bot);
    if (jobManager) jobManager.stop(false);
    if (brain) brain.stop();
    if (autonomous) autonomous.stop();
    if (villageBuilder) villageBuilder.stop();
    if (smartBrain) smartBrain.stop();
    return true;
  }

  if (command === "attack") return modules.combat.attackNearestMob(bot, Number(args[1]) || 6);
  if (command === "guard") { reply("🛡️ Guard tick uitgevoerd."); return modules.combat.guardTick(bot, Number(args[1]) || 6); }
  if (command === "eat") return modules.survival.eatFood(bot);
  if (command === "status") { reply(modules.survival.healthStatus(bot)); return true; }
  if (command === "sleep") { if (sub === "wake") return modules.sleep.wakeUp(bot); return modules.sleep.sleepInNearestBed(bot, sub === "force"); }

  if (command === "brain") {
    if (!brain) return reply("❌ Brain is niet geladen.");
    if (sub === "start") return brain.start();
    if (sub === "stop") return brain.stop();
    reply(brain.status());
    return true;
  }

  if (command === "job") {
    if (!jobManager) return reply("❌ Job manager is niet geladen.");
    if (sub === "stop") return jobManager.stop();
    if (sub === "status") return reply(jobManager.status());
    if (["wood", "mine", "fish", "farm"].includes(sub)) return jobManager.start(sub, args[2] || "none");
    reply("Gebruik: job wood | job mine stone | job fish | job farm wheat | job stop | job status");
    return false;
  }

  if (command === "bal" || command === "balance") return modules.economy.checkBalance(bot);
  if (command === "sell") return modules.economy.sellInventory(bot);
  if (command === "sellall") return modules.economy.quickSell(bot);
  if (command === "shop") return modules.economy.openShop(bot);
  if (command === "ah") return modules.economy.openAuctionHouse(bot);
  if (command === "pay") return modules.economy.payPlayer(bot, args[1], args[2]);

  reply("❌ Onbekend command. Gebruik: bot help");
  return false;
}

module.exports = { handleCommand };
