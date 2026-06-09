const { wait, waitForWindow, isProtectedItem } = require("../utils/helpers");

async function openAuction(bot) {
  if (!bot || !bot.entity) return false;

  try {
    bot.chat("/ah");
    const window = await waitForWindow(bot, 6000);

    if (!window) {
      bot.chat("❌ Auction menu niet gevonden.");
      return null;
    }

    bot.chat(`🏪 Auction geopend: ${window.title || "unknown"}`);
    return window;
  } catch (err) {
    bot.chat(`❌ Auction openen mislukt: ${err.message}`);
    return null;
  }
}

function scanAuctionWindow(window) {
  if (!window || !window.slots) return [];

  const items = [];

  for (let slot = 0; slot < window.slots.length; slot++) {
    const item = window.slots[slot];
    if (!item || !item.name) continue;

    items.push({
      slot,
      name: item.name,
      displayName: item.displayName || item.name,
      count: item.count || 1,
      type: item.type,
      protected: isProtectedItem(item)
    });
  }

  return items;
}

function auctionReport(items) {
  if (!items || !items.length) return "🏪 Auction report: geen items gevonden.";

  const safeItems = items
    .filter(item => item.slot < 45)
    .slice(0, 15)
    .map(item => `${item.slot}: ${item.displayName} x${item.count}`);

  return safeItems.length
    ? `🏪 Auction report | ${safeItems.join(" | ")}`
    : "🏪 Auction report: geen verkoopitems gevonden.";
}

async function scanAuction(bot) {
  const window = await openAuction(bot);
  if (!window) return [];

  await wait(500);
  const items = scanAuctionWindow(window);
  bot.chat(auctionReport(items).slice(0, 250));
  return items;
}

async function closeAuction(bot) {
  if (!bot || !bot.currentWindow) return false;

  try {
    bot.closeWindow(bot.currentWindow);
    bot.chat("🏪 Auction gesloten.");
    return true;
  } catch {
    return false;
  }
}

async function sellHeldItem(bot, price) {
  if (!bot || !bot.entity) return false;

  if (!price || Number.isNaN(Number(price))) {
    bot.chat("Gebruik: auction sellheld <prijs>");
    return false;
  }

  const held = bot.heldItem;
  if (!held) {
    bot.chat("❌ Ik heb geen item in mijn hand.");
    return false;
  }

  if (isProtectedItem(held)) {
    bot.chat(`🛡️ Ik verkoop protected item niet: ${held.name}`);
    return false;
  }

  bot.chat(`/ah sell ${price}`);
  await wait(1200);
  bot.chat(`🏪 Sell command gestuurd voor ${held.name} voor ${price}.`);
  return true;
}

module.exports = {
  openAuction,
  scanAuctionWindow,
  auctionReport,
  scanAuction,
  closeAuction,
  sellHeldItem
};
