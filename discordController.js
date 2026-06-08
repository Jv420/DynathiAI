const { Client, GatewayIntentBits } = require("discord.js");

function startDiscordController({ botRef, actions, log }) {
  const discord = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  discord.once("ready", () => {
    log(`✅ Discord bot online als ${discord.user.tag}`);
  });

  discord.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (process.env.DISCORD_CHANNEL_ID && message.channel.id !== process.env.DISCORD_CHANNEL_ID) return;
    if (!message.content.startsWith("!bot")) return;

    const bot = botRef();
    if (!bot || !bot.entity) return message.reply("❌ Minecraft bot is nog niet online.");

    const args = message.content.split(" ");
    const command = args[1]?.toLowerCase();

    try {
      if (command === "help") {
        return message.reply(
          "**DynathiAI commands**\n" +
          "`!bot status`\n" +
          "`!bot say <bericht>`\n" +
          "`!bot follow`\n" +
          "`!bot stop`\n" +
          "`!bot mine <block> <aantal>`\n" +
          "`!bot chop <aantal>`\n" +
          "`!bot build <block>`\n" +
          "`!bot inv`\n" +
          "`!bot eat`\n" +
          "`!bot guard`\n" +
          "`!bot attack`\n" +
          "`!bot sell`\n" +
          "`!bot worker start`\n" +
          "`!bot worker stop`\n" +
          "`!bot worker status`\n" +
          "`!bot spawn`"
        );
      }

      if (command === "status") {
        const p = bot.entity.position;
        return message.reply(`❤️ ${bot.health} | 🍗 ${bot.food} | X:${Math.floor(p.x)} Y:${Math.floor(p.y)} Z:${Math.floor(p.z)}`);
      }

      if (command === "follow") { actions.followOwner(); return message.reply("✅ Volgen gestart"); }
      if (command === "stop") { actions.stopAll(); return message.reply("🛑 Gestopt"); }
      if (command === "mine") { await actions.mineBlock(args[2] || "dirt", Number(args[3] || 1)); return message.reply("⛏️ Mining gestart"); }
      if (command === "chop") { await actions.chopWood(Number(args[2] || 10)); return message.reply("🪓 Houthakken gestart"); }
      if (command === "build") { await actions.buildBlock(args[2] || "dirt"); return message.reply("🧱 Build uitgevoerd"); }
      if (command === "sell") { await actions.autoSell(); return message.reply("💰 AutoSell uitgevoerd"); }
      if (command === "eat") { await actions.eatFood(); return message.reply("🍗 Eten uitgevoerd"); }
      if (command === "attack") { actions.attackNearestMob(); return message.reply("⚔️ Attack uitgevoerd"); }

      if (command === "worker") {
        const subCommand = args[2]?.toLowerCase();

        if (subCommand === "start") {
          actions.startWorker();
          return message.reply("💼 Worker mode gestart. Ik hak hout, verkoop items en herhaal dit automatisch.");
        }

        if (subCommand === "stop") {
          actions.stopWorker();
          return message.reply("🛑 Worker mode gestopt.");
        }

        if (subCommand === "status") {
          return message.reply(actions.workerStatus());
        }

        return message.reply("Gebruik: `!bot worker start`, `!bot worker stop` of `!bot worker status`");
      }

      return message.reply("Gebruik !bot help");
    } catch (err) {
      return message.reply("❌ Fout: " + err.message);
    }
  });

  if (process.env.DISCORD_TOKEN) {
    discord.login(process.env.DISCORD_TOKEN);
  }
}

module.exports = { startDiscordController };
