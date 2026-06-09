# 🤖 DynathiAI Pro Core - Minecraft AI Bot voor DynathiSMP

DynathiAI is een Minecraft Java bot gemaakt met **Mineflayer**. De bot kan verbinden met je Minecraft server, Discord commands ontvangen, jobs uitvoeren, waypoints onthouden, items verkopen, minen, hout hakken, vissen, farmen, bouwen en basis AI-acties uitvoeren.

Deze README is expres **noob vriendelijk** gemaakt. Alles staat stap voor stap uitgelegd 😄

---

## ✅ Starten

Installeer packages:

```bash
npm install
```

Start de bot:

```bash
npm start
```

Of:

```bash
node bot.js
```

---

## ⚙️ .env voorbeeld

Maak een `.env` bestand in de projectmap:

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

Belangrijk voor Paper servers:

```properties
enforce-secure-profile=false
```

Zet dit in `server.properties` als je errors krijgt zoals `missing profile public key`, `invalid signature` of `broken chain`.

---

# 🎮 Prefixes

## Discord

Gebruik:

```txt
!bot
```

Voorbeeld:

```txt
!bot help
```

## Minecraft chat

Gebruik:

```txt
bot
```

Voorbeeld:

```txt
bot help
```

---

# 📜 Alle commands

## Basis

```txt
!bot help
!bot status
!bot stop
```

Minecraft chat:

```txt
bot help
bot status
bot stop
```

---

## ⛏️ Mining

```txt
!bot mine stone 5
!bot mine coal_ore 3
!bot mine iron_ore 3
!bot mine dirt 10
```

Minecraft:

```txt
bot mine stone 5
```

De bot heeft een goede tool nodig, bijvoorbeeld:

```txt
/give Dynathi diamond_pickaxe 1
```

---

## 🌲 Woodcutting

```txt
!bot chop 10
!bot wood 10
```

Minecraft:

```txt
bot chop 10
```

---

## 🎣 Fishing

```txt
!bot fish
```

De bot heeft een fishing rod nodig:

```txt
/give Dynathi fishing_rod 1
```

---

## 🌾 Farming

```txt
!bot farm wheat 20
!bot farm carrot 20
!bot farm potato 20
!bot farm beetroot 20
!bot farm sugar_cane 20
!bot farm melon 20
!bot farm pumpkin 20
```

---

## 📦 Chest en Shulker storage

Zet een chest of shulker dichtbij de bot.

```txt
!bot chest store
!bot chest dump
!bot chest take oak_log 64

!bot shulker store
!bot shulker dump
!bot shulker take diamond 1
```

Let op: `store` verplaatst verkoopbare/niet-beschermde items naar de chest.

---

## 🧰 Crafting

```txt
!bot craft chest 1
!bot craft furnace 1
!bot craft stone_pickaxe 1
!bot craft stone_axe 1
!bot craft shield 1
```

Voor sommige recepten moet er een crafting table dichtbij staan.

---

## 🏠 Building

```txt
!bot build floor oak_planks 5 5
!bot build wall oak_planks 10 4
```

De bot moet de blocks in inventory hebben:

```txt
/give Dynathi oak_planks 64
```

---

## 🧭 Navigation

Naar coördinaten:

```txt
!bot goto 100 64 -200
```

Naar speler:

```txt
!bot follow JouwNaam
```

Stoppen:

```txt
!bot stop
```

---

# 📍 Waypoints

Waypoints worden opgeslagen in:

```txt
data/waypoints.json
```

Ze blijven dus bewaard na een restart.

## Waypoint opslaan

Ga met de bot naar de plek en typ:

```txt
!bot waypoint set home
!bot waypoint set farm
!bot waypoint set mine
!bot waypoint set warehouse
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
!bot goto farm
!bot goto mine
!bot goto warehouse
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
warehouse
farm
mine
fishing
bed
auction
shop
spawn
animalfarm
```

---

# 💼 Jobs

## Job starten

```txt
!bot job wood
!bot job mine stone
!bot job fish
!bot job farm wheat
```

## Job status

```txt
!bot job status
```

## Job stoppen

```txt
!bot job stop
```

Jobs kunnen automatisch acties herhalen, zoals vissen, hout hakken of minen.

---

# 🧠 AI Brain

De Brain controleert basisbehoeftes zoals food, health en inventory.

```txt
!bot brain
!bot brain start
!bot brain stop
```

Voorbeeld output:

```txt
🧠 Brain: aan | 🧠 Brain: alles ziet er goed uit.
```

---

# 🍗 Survival

```txt
!bot eat
!bot status
```

Status toont health, food en positie.

---

# ⚔️ Combat

```txt
!bot attack
!bot guard
```

`guard` voert een guard tick uit en valt mobs dichtbij aan.

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

Belangrijk: `balance` gebruikt server command:

```txt
/balance
```

AutoSell gebruikt:

```txt
/sell
```

De bot probeert protected items niet te verkopen, zoals tools, armor, diamonds, emeralds, netherite en fishing rods.

---

# 🏪 AuctionAI SAFE

AuctionAI is expres veilig gemaakt.

De bot mag:

```txt
✅ /ah openen
✅ items scannen
✅ rapport maken
✅ sluiten
✅ handmatig held item verkopen
```

De bot mag NIET:

```txt
❌ auto buy
❌ auto bid
❌ auto click buy
❌ geld uitgeven zonder opdracht
```

Module bestaat al, maar sommige auction commands kunnen nog extra gekoppeld worden als je dat wilt.

---

# 📦 WarehouseAI

WarehouseAI kan items in categorieën herkennen:

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

Module bestaat al. Extra commands zoals `!bot warehouse report` kunnen later nog gekoppeld worden.

---

# 🗺️ Explorer

Explorer kan zoeken naar:

```txt
forest
cave
ore
water
village
farm
chest
```

Module bestaat al. Extra commands zoals `!bot explore forest` kunnen later nog gekoppeld worden.

---

# 🤖 Autonomous Mode

Autonomous Mode bestaat als module, maar moet voorzichtig gebruikt worden.

Doel:

```txt
honger -> eten
inventory vol -> chest zoeken
geen pickaxe -> craften
geen eten -> farmen
geen job -> job starten
```

Extra commands zoals `!bot auto start` kunnen later nog gekoppeld worden.

---

# 🧪 Aanbevolen testvolgorde

Gebruik dit na een update:

```txt
!bot status
!bot brain
!bot brain start
!bot job status
!bot mine stone 1
!bot chop 1
!bot fish
!bot waypoint set home
!bot waypoint list
!bot goto home
```

Daarna pas testen:

```txt
!bot sell
!bot chest store
!bot build floor oak_planks 5 5
```

---

# ⚠️ Veelvoorkomende meldingen

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
/give Dynathi oak_planks 64
```

## Fishing cancelled

```txt
❌ Vissen mislukt: Fishing cancelled
```

Controleer of de bot een fishing rod heeft en stil staat.

## Discord commands werken niet

Controleer:

```txt
DISCORD_TOKEN
Message Content Intent
Bot permissions
Bot zit in je server
```

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
