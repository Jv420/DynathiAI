# 🤖 DynathiAI Pro Core - Minecraft AI Bot voor DynathiSMP

DynathiAI is een Minecraft Java bot gemaakt met **Mineflayer**. De bot kan verbinden met je Minecraft server, Discord commands ontvangen, jobs uitvoeren, waypoints onthouden, minen, hout hakken, farmen, items opslaan, bases bouwen en draaien als **autonome SMP-kolonist / SMP-beschaving**.

Nieuw in deze versie:

```txt
✅ SmartBrain Colony AI
✅ Multi Storage Network
✅ Auto Logistics + Multi-Stop Logistics
✅ Human Behaviour System
✅ Road Network System
```

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
npm install
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
SMART_INTERVAL_MS=15000

SMART_HOME_WAYPOINT=home
SMART_WAREHOUSE_WAYPOINT=warehouse
SMART_FARM_WAYPOINT=farm
SMART_MINE_WAYPOINT=mine
SMART_LUMBER_WAYPOINT=lumberyard
SMART_OUTPOST_WAYPOINT=outpost

SMART_MIN_FOOD=16
SMART_MIN_LOGS=32
SMART_MIN_STONE=64

SMART_COLONY_ENABLED=true
SMART_EXPANSION_ENABLED=true
SMART_TERRITORY_ENABLED=true
SMART_LOGISTICS_ENABLED=true
SMART_HUMAN_ENABLED=true
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

---

# 🚀 Snelle start voor DynathiSMP

## 1. Zet waypoints

Gebruik een vlak testgebied met genoeg ruimte.

```txt
bot waypoint set home
bot waypoint set warehouse
bot waypoint set farm
bot waypoint set mine
bot waypoint set lumberyard
bot waypoint set outpost
```

Tip: zet `outpost` 50 tot 100 blocks verderop.

## 2. Geef testmateriaal

Gebruik je eigen botnaam als die anders is dan `Dynathi`.

```txt
/give Dynathi bread 32
/give Dynathi stone_pickaxe 1
/give Dynathi stone_axe 1
/give Dynathi oak_planks 1024
/give Dynathi oak_fence 256
/give Dynathi cobblestone 512
/give Dynathi stone_bricks 512
/give Dynathi stick 64
/give Dynathi chest 32
/give Dynathi crafting_table 8
```

## 3. Plaats chests

Plaats minimaal één chest bij:

```txt
warehouse
farm
mine
lumberyard
outpost
```

Aanbevolen inhoud:

```txt
farm chest       = food, crops, seeds
lumberyard chest = logs, planks, saplings
mine chest       = stone, cobble, ores
warehouse chest  = bouwmateriaal en overflow
outpost chest    = reserve voorraad
```

## 4. Start SmartBrain

```txt
bot smart start
bot smart colony on
bot smart expansion on
bot smart territory on
bot smart logistics on
bot smart human on
bot smart status
```

---

# 🧠 SmartBrain commands

```txt
bot smart start
bot smart stop
bot smart status
bot smart tick
```

Waypoints instellen:

```txt
bot smart home home
bot smart warehouse warehouse
bot smart farm farm
bot smart mine mine
bot smart lumber lumberyard
bot smart outpost outpost
```

Colony Builder:

```txt
bot smart colony
bot smart colony on
bot smart colony off
```

Expansion Planner:

```txt
bot smart expansion
bot smart expansion on
bot smart expansion off
```

Territory / Outpost:

```txt
bot smart territory
bot smart territory on
bot smart territory off
bot smart outpost outpost
```

Logistics:

```txt
bot smart logistics on
bot smart logistics off
bot smart logistics status
```

Human Behaviour:

```txt
bot smart human on
bot smart human off
bot smart human status
```

Alias:

```txt
bot smart player on
bot smart player off
bot smart player status
```

Alles stoppen:

```txt
bot stop
```

---

# 🤖 Rollen van Dynathi

Dynathi kiest automatisch rollen:

```txt
🛡️ Survivor           lage health / veiligheid
🌙 Sleeper            nacht / bed zoeken
🌾 Farmer             voedsel regelen
🌲 Lumberjack         hout en bouwmaterialen verzamelen
⛏️ Miner              steen verzamelen
🔨 Crafter            tools maken
📦 Warehouse Manager  voorraad pakken
🚚 Logistics Manager  items sorteren en opslagroutes rijden
🏗️ Builder            projecten bouwen
🏕️ Outpost Builder    nieuwe outpost bouwen
🤖 Colonist           onderhoud en wachten
```

Status bekijken:

```txt
bot smart status
```

---

# 🏘️ Bouwvolgorde

## Colony fase

```txt
1. Starter Base
2. Farm Plot
3. Warehouse
4. Watchtower
```

## Expansion fase

```txt
5. Animal Pen
6. Extra Farm
7. Extra Storage
```

## Territory fase

```txt
8. Outpost Base
9. Outpost Farm
10. Outpost Storage
```

---

# 📦 V5 Multi Storage + Auto Logistics

Dynathi gebruikt nu meerdere opslagpunten.

## Voorraad pakken

```txt
Food route:     farm -> warehouse
Wood route:     lumberyard -> warehouse
Stone route:    mine -> warehouse
Building route: warehouse -> lumberyard -> outpost
```

## Voorraad sorteren

Als zijn inventory bijna vol is, gebruikt hij multi-stop logistics:

```txt
🌾 food/crops/seeds -> farm chest
🌲 logs/planks      -> lumberyard chest
⛏️ stone/ores       -> mine chest
🏗️ building items   -> warehouse chest
📦 overig/overflow  -> warehouse chest
```

Aan/uit zetten:

```txt
bot smart logistics on
bot smart logistics off
bot smart logistics status
```

---

# 👤 V6 Human Behaviour System

Dynathi probeert minder robotachtig te bewegen.

Hij kan nu:

```txt
👀 random rondkijken
⏱️ natuurlijke pauzes nemen
🦘 kleine jump/fidget acties doen
🍖 eerder eten voordat hij bijna doodgaat
🏠 soms terug naar home tijdens idle
🚚 trager en menselijker met chests werken
```

Aan/uit zetten:

```txt
bot smart human on
bot smart human off
bot smart human status
```

In status zie je bijvoorbeeld:

```txt
Human: aan
Human idle: 12
Last human: look_around
```

---

# 🛣️ V7 Road Network System

Dynathi kan wegen bouwen tussen waypoints.

## Eén weg bouwen

```txt
bot road build home warehouse
bot road build warehouse farm
bot road build warehouse mine
bot road build warehouse lumberyard
bot road build warehouse outpost
```

Met eigen blok:

```txt
bot road build home warehouse stone_bricks
bot road build warehouse farm cobblestone
```

## Hele network bouwen

```txt
bot road network
```

Of met blok naar keuze:

```txt
bot road network stone_bricks
```

Road network routes:

```txt
home -> warehouse
warehouse -> farm
warehouse -> mine
warehouse -> lumberyard
warehouse -> outpost
```

Let op: zorg dat Dynathi genoeg bouwblokken in zijn inventory heeft.

---

# 📍 Waypoints

Waypoints worden opgeslagen in:

```txt
data/waypoints.json
```

Belangrijkste waypoints:

```txt
home
warehouse
farm
mine
lumberyard
outpost
```

Waypoint opslaan:

```txt
bot waypoint set home
```

Waypoints bekijken:

```txt
bot waypoint list
```

Naar waypoint lopen:

```txt
bot goto home
bot goto warehouse
bot goto farm
bot goto mine
bot goto lumberyard
bot goto outpost
```

Waypoint verwijderen:

```txt
bot waypoint remove outpost
```

---

# 📦 WarehouseAI

```txt
bot warehouse report
bot warehouse store
bot warehouse storecat wood
bot warehouse storecat ores
bot warehouse storecat food
bot warehouse storecat tools
```

---

# 🏠 BaseBuilder

Los bouwen:

```txt
bot base starter oak_planks
bot base hut oak_planks 9 5
bot base platform oak_planks 9 9
bot base warehouse oak_planks 11 5
bot base farm oak_planks 11
bot base pen oak_fence 11
bot base tower oak_planks 10
```

---

# 🏘️ VillageBuilder

```txt
bot village start oak_planks
bot village status
bot village stop
```

---

# 💼 Jobs

```txt
bot job wood
bot job mine stone
bot job fish
bot job farm wheat
bot job status
bot job stop
```

---

# 🗺️ Explorer

```txt
bot explore
bot explore forest
bot explore cave
bot explore ore
bot explore water
bot explore village
bot explore farm
bot explore chest
```

---

# 🍗 Survival

```txt
bot eat
bot status
bot sleep
bot sleep force
bot sleep wake
```

Plaats voor SmartBrain liefst een bed, chest en crafting table bij home/warehouse.

---

# 💰 Economy

```txt
bot balance
bot bal
bot sell
bot sellall
bot shop
bot ah
bot pay SpelerNaam 1000
```

---

# 🧪 Aanbevolen testvolgorde

## Test 1: verbinding

```txt
bot help
bot status
```

## Test 2: waypoints

```txt
bot waypoint set home
bot waypoint set warehouse
bot waypoint set farm
bot waypoint set mine
bot waypoint set lumberyard
bot waypoint set outpost
bot waypoint list
```

## Test 3: SmartBrain starten

```txt
bot smart start
bot smart colony on
bot smart expansion on
bot smart territory on
bot smart logistics on
bot smart human on
bot smart status
```

## Test 4: storage/logistics

Vul Dynathi met verschillende items en laat zijn inventory bijna vol worden.

```txt
bot smart logistics status
```

Je wilt zien:

```txt
Role: Logistics Manager
Storage mode: multi-network + auto-logistics + multi-stop
```

## Test 5: roads

```txt
bot road build home warehouse cobblestone
bot road network cobblestone
```

## Test 6: bouwen controleren

```txt
bot smart status
```

Je wilt later zien:

```txt
Role: Builder
Project: starter_base / farm_plot / warehouse / watchtower
```

---

# ⚠️ Bekende testtips

- Test eerst op een vlak gebied.
- Geef genoeg oak_planks, oak_fence, cobblestone of stone_bricks voor de eerste test.
- Zet `home`, `warehouse`, `farm`, `mine`, `lumberyard` en `outpost` echt goed.
- Plaats chests dichtbij de juiste waypoints.
- Plaats een bed dichtbij home.
- Plaats een crafting table dichtbij warehouse.
- Gebruik `bot stop` als hij blijft lopen of bouwen.
- Na GitHub updates altijd `git pull`, `npm install` en de bot herstarten.

---
