# 🤖 DynathiAI Pro Core - Minecraft AI Bot voor DynathiSMP

DynathiAI is een Minecraft Java bot gemaakt met **Mineflayer**. De bot kan verbinden met je Minecraft server, Discord commands ontvangen, jobs uitvoeren, waypoints onthouden, minen, hout hakken, farmen, items opslaan, bases bouwen en nu ook draaien als **autonome SMP-kolonist / SMP-beschaving**.

Deze README is noob-vriendelijk gemaakt zodat je hem direct kunt testen 😄

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

Voor meer geheugen bij lange tests:

```bash
node --max-old-space-size=2048 bot.js
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

# 🚀 Snelle test: autonome SMP-kolonist

## 1. Zet de bot op een vlak testgebied

Gebruik een leeg vlak gebied met genoeg ruimte. Zet eerst de basis waypoints.

```txt
bot waypoint set home
bot waypoint set warehouse
bot waypoint set farm
bot waypoint set mine
bot waypoint set lumberyard
bot waypoint set outpost
```

Tip: zet `outpost` op een andere plek dan home, bijvoorbeeld 50 tot 100 blocks verderop.

## 2. Geef testmateriaal

Gebruik je eigen botnaam als die anders is dan `Dynathi`.

```txt
/give Dynathi bread 32
/give Dynathi stone_pickaxe 1
/give Dynathi stone_axe 1
/give Dynathi oak_planks 1024
/give Dynathi oak_fence 256
/give Dynathi cobblestone 256
/give Dynathi stick 64
/give Dynathi chest 32
/give Dynathi crafting_table 8
```

## 3. Start SmartBrain

```txt
bot smart start
bot smart colony on
bot smart expansion on
bot smart status
```

## 4. Test Territory / Outpost

```txt
bot smart status
```

De bot gebruikt standaard het waypoint:

```txt
outpost
```

Zorg dus dat deze bestaat:

```txt
bot waypoint set outpost
```

---

# 🧠 SmartBrain commands

```txt
bot smart start
bot smart stop
bot smart status
bot smart tick
```

Waypoints instellen voor SmartBrain:

```txt
bot smart home home
bot smart warehouse warehouse
bot smart farm farm
bot smart mine mine
bot smart lumber lumberyard
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

Alles stoppen:

```txt
bot stop
```

---

# 🤖 Wat doet de autonome SMP-kolonist?

Dynathi kiest automatisch een rol:

```txt
🛡️ Survivor          lage health / veiligheid
🌙 Sleeper           nacht / bed zoeken
🌾 Farmer            voedsel regelen
🌲 Lumberjack        hout en bouwmaterialen verzamelen
⛏️ Miner             steen verzamelen
🔨 Crafter           tools maken
📦 Warehouse Manager inventory opslaan
🏗️ Builder           projecten bouwen
🏕️ Outpost Builder   nieuwe outpost bouwen
🤖 Colonist          onderhoud en wachten
```

Status voorbeeld:

```txt
bot smart status
```

Output lijkt op:

```txt
🤖 Autonome SMP-beschaving: aan | Role: Builder | Task: Project bouwen: warehouse | Project: warehouse | 120/160 | ready_to_build
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

# 📍 Waypoints

Waypoints worden opgeslagen in:

```txt
data/waypoints.json
```

Belangrijkste waypoints voor SmartBrain:

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

Let op: bouwen werkt het beste op vlak terrein met genoeg ruimte.

---

# 🏘️ VillageBuilder

```txt
bot village start oak_planks
bot village status
bot village stop
```

VillageBuilder bouwt:

```txt
🏘️ Town Square
🏠 Starter House
🌾 Farm Plot
🐄 Animal Pen
🗼 Watchtower
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

## Test 3: basis AI status

```txt
bot smart status
bot smart tick
```

## Test 4: kolonist starten

```txt
bot smart start
bot smart colony on
bot smart expansion on
bot smart status
```

## Test 5: bouwen controleren

Wacht een paar minuten en gebruik:

```txt
bot smart status
```

Je wilt zien:

```txt
Role: Builder
Project: starter_base / farm_plot / warehouse / watchtower
```

## Test 6: outpost testen

Ga naar een nieuwe plek en zet:

```txt
bot waypoint set outpost
```

Ga terug naar home of laat de bot verder draaien.

Controleer:

```txt
bot smart status
```

Je wilt later zien:

```txt
Project: outpost_base
Role: Outpost Builder
```

---

# ⚠️ Bekende testtips

- Test eerst op een vlak gebied.
- Geef genoeg oak_planks en oak_fence voor de eerste test.
- Zet `home`, `warehouse`, `farm`, `mine`, `lumberyard` en `outpost` echt goed.
- Gebruik `bot stop` als hij blijft lopen of bouwen.
- Als crafting niet lukt, plaats een crafting table dichtbij.
- Als storage niet lukt, plaats een chest dichtbij warehouse.
- Als slapen niet lukt, plaats een bed dichtbij home.

---

# 🛑 Stoppen

```txt
bot stop
```

Of server-side:

```bash
CTRL + C
```

---

# ✅ Minimum testpakket

Voor een snelle demo is dit genoeg:

```txt
/give Dynathi bread 32
/give Dynathi stone_pickaxe 1
/give Dynathi stone_axe 1
/give Dynathi oak_planks 1024
/give Dynathi oak_fence 256
/give Dynathi cobblestone 256
/give Dynathi chest 32
/give Dynathi crafting_table 8

bot waypoint set home
bot waypoint set warehouse
bot waypoint set farm
bot waypoint set mine
bot waypoint set lumberyard
bot waypoint set outpost

bot smart start
bot smart colony on
bot smart expansion on
bot smart status
```

Veel plezier met je autonome DynathiSMP-kolonist 😎🔥
