# 🤖 DynathiAI Pro Core - Minecraft AI Bot voor DynathiSMP

DynathiAI is een Minecraft Java bot gemaakt met **Mineflayer**. De bot kan verbinden met je Minecraft server, Discord commands ontvangen, jobs uitvoeren, waypoints onthouden, items verkopen, minen, hout hakken, vissen, farmen, bouwen, bases maken, dorpen bouwen en Autonomous Mode draaien.

Deze README is expres **noob vriendelijk** gemaakt. Alles staat stap voor stap uitgelegd 😄

---

## ✅ Starten

```bash
npm install
npm start
```

Of:

```bash
node bot.js
```

Na elke GitHub update:

```bash
git pull
npm start
```

---

## ⚙️ .env voorbeeld

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

BRAIN_INTERVAL_MS=10000
AUTONOMOUS_INTERVAL_MS=20000
```

Voor Paper servers kan dit nodig zijn in `server.properties`:

```properties
enforce-secure-profile=false
```

---

# 🎮 Prefixes

Discord:

```txt
!bot
```

Minecraft chat:

```txt
bot
```

Voorbeeld:

```txt
!bot help
bot help
```

---

# 📜 Belangrijkste commands

## Basis

```txt
!bot help
!bot status
!bot stop
```

## Mining

```txt
!bot mine stone 5
!bot mine coal_ore 3
!bot mine iron_ore 3
!bot mine dirt 10
```

## Woodcutting

```txt
!bot chop 10
!bot wood 10
```

## Fishing

```txt
!bot fish
```

## Farming

```txt
!bot farm wheat 20
!bot farm carrot 20
!bot farm potato 20
!bot farm beetroot 20
!bot farm sugar_cane 20
```

## Storage

```txt
!bot chest store
!bot chest dump
!bot chest take oak_log 64

!bot shulker store
!bot shulker dump
!bot shulker take diamond 1
```

## Crafting

```txt
!bot craft chest 1
!bot craft furnace 1
!bot craft stone_pickaxe 1
!bot craft stone_axe 1
!bot craft shield 1
```

## Navigation

```txt
!bot goto 100 64 -200
!bot follow JouwNaam
!bot stop
```

---

# 🏠 BaseBuilder V2

BaseBuilder kan losse gebouwen en simpele structuren maken.

## Starter base

```txt
!bot base starter oak_planks
```

## Hut / house

```txt
!bot base hut oak_planks
!bot base hut oak_planks 9 5
```

## Platform

```txt
!bot base platform oak_planks 9 9
!bot base platform cobblestone 15 15
```

## Farm plot

```txt
!bot base farm oak_planks 11
```

## Animal pen

```txt
!bot base pen oak_fence 11
```

## Watchtower

```txt
!bot base tower oak_planks 10
```

## Eerste base test

```txt
/give Dynathi oak_planks 512
/give Dynathi oak_fence 256

!bot waypoint set base
!bot goto base
!bot base platform oak_planks 9 9
!bot base starter oak_planks
```

Let op: BaseBuilder V2 is nog simpel. Hij werkt het beste op vlakke grond met genoeg ruimte.

---

# 🏘️ VillageBuilder V1

VillageBuilder bouwt automatisch een klein dorp rond de plek waar de bot staat.

## Start dorp bouwen

```txt
!bot village start oak_planks
```

Of met cobblestone:

```txt
!bot village start cobblestone
```

## Status bekijken

```txt
!bot village status
```

Voorbeeld:

```txt
🏘️ VillageBuilder: aan | Step: farm_plot | Busy: true
```

## Stoppen

```txt
!bot village stop
```

Of alles stoppen:

```txt
!bot stop
```

## Wat bouwt VillageBuilder?

```txt
🏘️ Town Square / centraal plein
🏠 Starter House
🌾 Farm Plot
🐄 Animal Pen
🗼 Watchtower
```

Layout ongeveer:

```txt
        🗼

🌾  🏘️  🏠

      🐄
```

## Eerste VillageBuilder test

Geef Dynathi genoeg materiaal:

```txt
/give Dynathi oak_planks 1024
/give Dynathi oak_fence 512
```

Ga naar een groot vlak gebied en zet waypoint:

```txt
!bot waypoint set village
!bot goto village
```

Start dan:

```txt
!bot village start oak_planks
```

Controleer status:

```txt
!bot village status
```

Verwachte output:

```txt
🏘️ VillageBuilder gestart met oak_planks
🏗️ Platform bouwen: 15x15 met oak_planks
🏠 Starter hut bouwen
🌾 Farm plot bouwen
🐄 Animal pen bouwen
🗼 Watchtower bouwen
✅ VillageBuilder klaar
```

Belangrijk: gebruik eerst een vlak leeg terrein. VillageBuilder V1 gebruikt vaste afstanden rond het startpunt.

---

# 📍 Waypoints

Waypoints worden opgeslagen in:

```txt
data/waypoints.json
```

## Waypoint opslaan

```txt
!bot waypoint set home
!bot waypoint set base
!bot waypoint set village
!bot waypoint set warehouse
!bot waypoint set farm
!bot waypoint set mine
!bot waypoint set fishing
!bot waypoint set bed
```

Minecraft chat:

```txt
bot waypoint set home
```

## Waypoints bekijken

```txt
!bot waypoint list
```

## Naar waypoint lopen

```txt
!bot goto home
!bot goto base
!bot goto village
!bot goto warehouse
!bot goto farm
!bot goto mine
```

Of:

```txt
!bot waypoint goto home
```

## Waypoint verwijderen

```txt
!bot waypoint remove mine
!bot waypoint delete mine
```

Aanbevolen waypoints voor DynathiSMP:

```txt
home
base
village
warehouse
farm
mine
fishing
bed
spawn
animalfarm
shop
```

---

# 📦 WarehouseAI

WarehouseAI geeft overzicht van de inventory en kan items slim opslaan.

```txt
!bot warehouse report
!bot warehouse store
!bot warehouse storecat wood
!bot warehouse storecat ores
!bot warehouse storecat food
!bot warehouse storecat tools
```

Categorieën:

```txt
wood
stone
ores
food
tools
farming
valuables
misc
```

---

# 🗺️ Explorer

```txt
!bot explore
!bot explore forest
!bot explore cave
!bot explore ore
!bot explore water
!bot explore village
!bot explore farm
!bot explore chest
```

---

# 💼 Jobs

```txt
!bot job wood
!bot job mine stone
!bot job fish
!bot job farm wheat
!bot job status
!bot job stop
```

Jobs kunnen automatisch acties herhalen, zoals vissen, hout hakken, minen of farmen.

---

# 🧠 AI Brain

```txt
!bot brain
!bot brain start
!bot brain stop
```

---

# 🤖 Autonomous Mode

```txt
!bot auto start
!bot auto status
!bot auto stop
```

Alles stoppen:

```txt
!bot stop
```

## Wat doet Autonomous Mode?

Elke ongeveer 20 seconden controleert de bot zichzelf:

```txt
🍗 Heeft de bot honger? Dan probeert hij te eten.
📦 Is de inventory bijna vol? Dan probeert hij items in een chest op te slaan.
⛏️ Heeft hij geen pickaxe? Dan probeert hij een stone_pickaxe te craften.
🪓 Heeft hij geen axe? Dan probeert hij een stone_axe te craften.
🌾 Heeft hij geen eten? Dan probeert hij wheat te farmen.
💼 Draait er geen job? Dan start hij automatisch een wood job.
```

Beste Autonomous setup:

```txt
1x crafting table
1x chest
1x bed
water dichtbij voor fishing
farm dichtbij voor wheat/food
```

Starter spullen:

```txt
/give Dynathi bread 16
/give Dynathi stone_pickaxe 1
/give Dynathi stone_axe 1
/give Dynathi oak_planks 64
/give Dynathi cobblestone 32
/give Dynathi stick 16
```

---

# 🍗 Survival

```txt
!bot eat
!bot status
```

---

# ⚔️ Combat

```txt
!bot attack
!bot guard
```

---

# 🛏️ Sleep

Plaats een bed dichtbij de bot.

```txt
!bot sleep
!bot sleep force
!bot sleep wake
```

---

# 💰 Economy

```txt
!bot balance
!bot bal
!bot sell
!bot sellall
!bot shop
!bot ah
!bot pay SpelerNaam 1000
```

`balance` gebruikt:

```txt
/balance
```

AutoSell gebruikt:

```txt
/sell
```

De bot probeert protected items niet te verkopen, zoals tools, armor, diamonds, emeralds, netherite en fishing rods.

---

# 🧪 Aanbevolen testvolgorde

Na een update:

```txt
!bot status
!bot brain
!bot job status
!bot waypoint set base
!bot waypoint list
!bot goto base
!bot base platform oak_planks 9 9
!bot base starter oak_planks
!bot waypoint set village
!bot village start oak_planks
!bot village status
!bot warehouse report
!bot explore forest
!bot auto start
!bot auto status
!bot job status
```

Als je wilt stoppen:

```txt
!bot auto stop
!bot village stop
```

Of alles tegelijk:

```txt
!bot stop
```

---

# ⚠️ Veelvoorkomende meldingen

## Geen crafting table dichtbij

```txt
❌ Geen crafting table dichtbij gevonden.
```

Plaats een crafting table dichtbij de bot.

## Geen chest dichtbij

```txt
❌ Geen Chest dichtbij gevonden.
```

Plaats een chest binnen ongeveer 5 blokken van de bot.

## Geen bed dichtbij

```txt
❌ Geen bed dichtbij gevonden.
```

Plaats een bed dichtbij de bot.

## Geen oak_planks

```txt
🏠 Ik heb geen oak_planks in mijn inventory.
```

Geef de bot blocks:

```txt
/give Dynathi oak_planks 512
```

## Geen oak_fence

```txt
🐄 Animal pen bouwen: 11x11 met oak_fence
```

Als er weinig of geen fence wordt geplaatst:

```txt
/give Dynathi oak_fence 512
```

## BaseBuilder of VillageBuilder plaatst weinig blocks

Gebruik vlakke grond en genoeg ruimte. Test eerst:

```txt
!bot base platform oak_planks 9 9
```

Als dat werkt, test daarna:

```txt
!bot base starter oak_planks
```

Daarna pas:

```txt
!bot village start oak_planks
```

## Fishing cancelled

```txt
❌ Vissen mislukt: Fishing cancelled
```

Controleer of de bot een fishing rod heeft en stil staat.

## Autonomous controller is niet geladen

```txt
❌ Autonomous controller is niet geladen.
```

Doe eerst:

```bash
git pull
npm start
```

## VillageBuilder controller is niet geladen

```txt
❌ VillageBuilder controller is niet geladen.
```

Doe eerst:

```bash
git pull
npm start
```

De nieuwste versie geeft `runtime.villageBuilder` door aan Discord en Minecraft commands.

---

# 🔐 Veiligheid

Zet nooit openbaar online:

```txt
Discord bot token
Discord webhook URL
Microsoft wachtwoord
private keys
```

Gebruik altijd `.env` voor geheime gegevens.

---

# ❤️ Credits

Gemaakt voor **DynathiSMP** door Jv420 / DynathiAI.

Veel plezier met je AI Minecraft bot XD
