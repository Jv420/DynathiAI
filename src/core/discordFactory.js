const { Client, GatewayIntentBits } = require("discord.js");
const { handleCommand } = require("./commandHandler");

function startDiscordController(runtime) {
  if (!process.env.DISCORD_TOKEN) {
    runtime.logger.log("ℹ️ DISCORD_TOKEN ontbreekt, Discord controller niet gestart.");
    return null;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  client.once("ready", () => {
    runtime.state.discordClient = client;
    runtime.logger.log(`✅ Discord bot online als ${client.user.tag}`);
  });

  client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (!message.content.toLowerCase().startsWith("!bot ")) return;

    const bot = runtime.getBot();
    if (!bot || !bot.entity) {
      await message.reply("❌ Minecraft bot is nog niet online.");
      return;
    }

    const args = message.content.slice(5).trim().split(/\s+/);

    try {
      await handleCommand({
        bot,
        mcData: runtime.getMcData(),
        args,
        modules: runtime.modules,
        jobManager: runtime.jobManager,
        brain: runtime.brain,
        autonomous: runtime.autonomous,
        villageBuilder: runtime.villageBuilder,
        smartBrain: runtime.smartBrain,
        reply: text => message.reply(String(text).slice(0, 1900))
      });
    } catch (err) {
      await message.reply(`❌ Discord command fout: ${err.message}`);
      runtime.logger.log(`❌ Discord command fout: ${err.stack || err.message}`);
    }
  });

  client.login(process.env.DISCORD_TOKEN).catch(err => {
    runtime.logger.log(`❌ Discord login mislukt: ${err.message}`);
  });

  return client;
}

module.exports = { startDiscordController };
