# 🤖 DynathiAI - Minecraft Mineflayer Bot voor DynathiSMP

DynathiAI is een Minecraft Java bot gemaakt met **Mineflayer**.  
De bot kan verbinden met je Minecraft server, Discord commands ontvangen, hout hakken, minen, bouwen, mobs aanvallen, automatisch eten, automatisch verkopen via `/sell` en zelfs een simpele Worker Mode draaien.

Deze README is expres **noob vriendelijk** gemaakt. Stap voor stap dus 😄

---

## ✅ Wat kan DynathiAI?

- Joinen op je Minecraft Java server
- Werken met online-mode Microsoft login
- Discord commands gebruiken met `!bot`
- Minecraft chat commands gebruiken met `bot`
- Speler volgen
- Blocks minen
- Hout hakken
- Simpel bouwen
- Inventory bekijken
- Automatisch eten
- Mobs aanvallen
- Guard mode
- Auto reconnect bij disconnect
- Discord webhook logs sturen
- `/sell` GUI gebruiken door items erin te plaatsen en het venster te sluiten
- Worker Mode: hout hakken → verkopen → balance checken → herhalen

---

## ⚠️ Belangrijk om te weten

DynathiAI is een **Java Minecraft bot**.

Dat betekent:

- De bot logt in als Java speler.
- De bot heeft een echte Microsoft/Minecraft Java account nodig als je server `online-mode=true` gebruikt.
- Bedrock spelers kunnen de bot wel commands geven als jouw server Geyser/Floodgate gebruikt.
- De bot zelf is geen Bedrock client.

---

## 📦 Benodigdheden

Installeer eerst:

1. **Node.js**  
   Aanrader: Node.js 20 LTS  
   Download: https://nodejs.org/

2. **Een Minecraft Java account voor de bot**  
   Bijvoorbeeld een apart Microsoft account dat Minecraft Java bezit.

3. **Een Discord bot token** als je Discord commands wilt gebruiken.

4. **Een Discord webhook URL** als je logs naar Discord wilt sturen.

---

## 📁 Project downloaden

Open PowerShell of CMD en typ:

```bash
git clone https://github.com/Jv420/DynathiAI.git
cd DynathiAI
```

Installeer daarna alle packages:

```bash
npm install
```

---

## ⚙️ .env bestand maken

Maak in de projectmap een bestand genaamd:

```txt
.env
```

Zet hierin:

```env
BOT_HOST=dynathiv2.duckdns.org
BOT_PORT=25565
BOT_USERNAME=jouw-bot-email@outlook.com
BOT_VERSION=1.21.11
AUTH=microsoft

OWNER_NAME=JouwMinecraftNaam

DISCORD_TOKEN=JOUW_DISCORD_BOT_TOKEN
DISCORD_CHANNEL_ID=JOUW_DISCORD_CHANNEL_ID
DISCORD_WEBHOOK_URL=JOUW_DISCORD_WEBHOOK_URL
```

### Uitleg

| Naam | Betekenis |
|---|---|
| `BOT_HOST` | IP of domein van je Minecraft server |
| `BOT_PORT` | Meestal `25565` |
| `BOT_USERNAME` | Email van het Microsoft/Minecraft Java account van de bot |
| `BOT_VERSION` | Minecraft versie, bijvoorbeeld `1.21.11` |
| `AUTH` | Voor online-mode gebruik je `microsoft` |
| `OWNER_NAME` | Jouw exacte Minecraft naam op de server |
| `DISCORD_TOKEN` | Token van je Discord bot |
| `DISCORD_CHANNEL_ID` | Kanaal waar `!bot` commands toegestaan zijn |
| `DISCORD_WEBHOOK_URL` | Webhook voor logs |

---

## 🟦 Bedrock / Geyser / Floodgate gebruikers

Speel je zelf via Bedrock? Dan kan dat gewoon.

De bot blijft een Java speler, maar jij kunt via Bedrock commands typen in de Minecraft chat.

Let op je naam. Bedrock spelers krijgen vaak een punt voor hun naam, bijvoorbeeld:

```txt
.Jochem
```

Dan moet je in `.env` zetten:

```env
OWNER_NAME=.Jochem
```

Gebruik exact dezelfde naam als in de server console verschijnt.

---

## ▶️ Bot starten

Start de bot met:

```bash
npm start
```

Of:

```bash
node bot.js
```

Bij eerste Microsoft login kan Mineflayer vragen om in te loggen via een Microsoft device code.

---

## 🎮 Minecraft commands

Typ deze commands in Minecraft chat:

```txt
bot help
bot follow
bot stop
bot mine dirt 5
bot mine stone 10
bot chop 10
bot build dirt
bot inv
bot eat
bot attack
bot guard
bot sell
bot worker start
bot worker stop
bot worker status
bot spawn
bot home
bot sethome bot
bot bal
```

---

## 💬 Discord commands

Typ deze commands in het ingestelde Discord kanaal:

```txt
!bot help
!bot status
!bot say Hallo DynathiSMP!
!bot follow
!bot stop
!bot mine dirt 5
!bot mine stone 10
!bot chop 10
!bot build dirt
!bot inv
!bot eat
!bot attack
!bot guard
!bot sell
!bot worker start
!bot worker stop
!bot worker status
!bot spawn
```

---

## 💰 AutoSell uitleg

DynathiAI gebruikt jouw `/sell` GUI zo:

1. De bot doet `/sell`.
2. De sell GUI opent.
3. De bot zet verkoopbare items in de bovenste vakken.
4. De bot sluit de GUI.
5. De verkoop start automatisch.

De bot probeert belangrijke spullen te bewaren, zoals:

- Pickaxes
- Axes
- Shovels
- Swords
- Bows
- Armor
- Diamonds
- Netherite
- Emeralds

---

## 💼 Worker Mode uitleg

Worker Mode laat de bot automatisch geld verdienen.

Start:

```txt
!bot worker start
```

Of in Minecraft:

```txt
bot worker start
```

De bot doet dan:

```txt
1. Hout zoeken
2. Hout hakken
3. Items verkopen via /sell
4. /balance checken
5. Na ongeveer 90 seconden opnieuw beginnen
```

Stoppen:

```txt
!bot worker stop
```

Status:

```txt
!bot worker status
```

---

## ⛏️ Stone minen werkt niet?

Voor stone heeft de bot een pickaxe nodig.

Geef de bot bijvoorbeeld:

```txt
/give DynathiAI stone_pickaxe
```

Of:

```txt
/give DynathiAI diamond_pickaxe
```

Daarna:

```txt
!bot mine stone 10
```

---

## ❌ Veelvoorkomende fouten

### Failed to obtain profile data

Fout:

```txt
Failed to obtain profile data, does the account own minecraft?
```

Oplossing:

- Controleer of het Microsoft account Minecraft Java bezit.
- Log met dat account in op de officiële Minecraft Launcher.
- Start Minecraft Java één keer handmatig.
- Gebruik daarna hetzelfde account in `.env`.

---

### Alleen mijn eigenaar mag mij commands geven

Dan klopt `OWNER_NAME` niet.

Controleer exact hoe je naam in de server verschijnt.

Voor Bedrock kan dit bijvoorbeeld zijn:

```txt
.JouwNaam
```

Dan moet je `.env` ook zo zijn:

```env
OWNER_NAME=.JouwNaam
```

---

### Discord commands werken niet

Controleer:

- Staat `DISCORD_TOKEN` goed?
- Heeft je bot de juiste intents aan in Discord Developer Portal?
- Staat `Message Content Intent` aan?
- Klopt `DISCORD_CHANNEL_ID`?
- Zit de Discord bot in je server?

---

## 🧱 Naar .exe maken

Wil je van de bot een Windows `.exe` maken?

Gebruik liever Node.js 20 LTS.

Installeer pkg:

```bash
npm install -g pkg
```

Maak de exe:

```bash
pkg bot.js --targets node18-win-x64 --output DynathiAI.exe
```

Let op: houd je `.env` bestand naast de `.exe`, want daar staan je instellingen in.

---

## 🔐 Veiligheid

Zet nooit deze dingen openbaar online:

- Discord bot token
- Discord webhook URL
- Microsoft wachtwoord
- Private keys

Gebruik altijd `.env` voor geheime gegevens.

---

## 🚀 Toekomstige ideeën

Mogelijke upgrades:

- Worker Mode V2 met mining mode
- Auto quarry miner
- Auto farm
- Auto chest storage
- Auction House trader
- Shop GUI automation
- AI chat met Ollama of OpenAI API
- Zelf huisjes bouwen
- Meerdere bots tegelijk

---

## ❤️ Credits

Gemaakt voor **DynathiSMP** door Jv420 / DynathiAI.

Veel plezier met je AI Minecraft bot XD
