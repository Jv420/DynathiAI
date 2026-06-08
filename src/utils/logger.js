const axios = require("axios");

function createLogger() {
  function sendWebhook(message) {
    if (!process.env.DISCORD_WEBHOOK_URL) return;

    axios.post(process.env.DISCORD_WEBHOOK_URL, {
      content: `🤖 **DynathiAI** | ${message}`
    }).catch(() => {});
  }

  function log(message) {
    console.log(message);
    sendWebhook(message);
  }

  return { log, sendWebhook };
}

module.exports = { createLogger };
