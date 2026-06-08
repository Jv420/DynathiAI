const { wait, waitForWindow, isProtectedItem } = require("../utils/helpers");

async function sendEconomyCommand(bot, command, delayMs = 1200) {
  if (!bot || !bot.entity) return false;

  try {
    bot.chat(command);
    await wait(delayMs);
    return true;
  } catch (err) {
    console.log("Economy command error:", err.message);
    return false;
  }
}

async function checkBalance(bot) {
  return sendEconomyCommand(bot, "/bal", 1000);
}

async function openShop(bot) {
  return sendEconomyCommand(bot, "/shop", 1200);
}

async function openAuctionHouse(bot) {
  return sendEconomyCommand(bot, "/ah", 1200);
}

async function sellInventory(bot) {
  if (!bot || !bot.entity) return false;

  try {
    bot.chat("/sell");
    const window = await waitForWindow(bot, 6000);

    if (!window) {
      bot.chat("❌ Sell menu niet gevonden.");
      return false;
    }

    const sellItems = bot.inventory.items().filter(item => !isProtectedItem(item));
    let moved = 0;

    for (const item of sellItems) {
      const fresh = bot.inventory.items().find(i => i.type === item.type);
      if (!fresh) continue;

      try {
        await bot.clickWindow(fresh.slot, 0, 0);
        moved++;
        await wait(120);
      } catch (err) {
        console.log("Sell click error:", err.message);
      }
    }

    await wait(500);
    bot.closeWindow(window);
    bot.chat(`💰 AutoSell klaar: ${moved} stacks in sell menu gezet.`);
    return moved > 0;
  } catch (err) {
    bot.chat(`❌ AutoSell mislukt: ${err.message}`);
    return false;
  }
}

async function quickSell(bot) {
  return sendEconomyCommand(bot, "/sellall", 1200);
}

async function payPlayer(bot, playerName, amount) {
  if (!playerName || !amount) {
    bot.chat("Gebruik: pay <speler> <bedrag>");
    return false;
  }

  return sendEconomyCommand(bot, `/pay ${playerName} ${amount}`, 1200);
}

module.exports = {
  sendEconomyCommand,
  checkBalance,
  openShop,
  openAuctionHouse,
  sellInventory,
  quickSell,
  payPlayer
};
