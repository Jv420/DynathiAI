# 🤖 DynathiAI - Complete Commands.md

Dit bestand bevat alle belangrijke commands van de bot, overzichtelijk per categorie.

## Prefixes

Minecraft chat:

```txt
bot
```

Discord:

```txt
!bot
```

Voorbeelden:

```txt
bot help
!bot help
```

> In Minecraft gebruik je `bot`. In Discord gebruik je `!bot`.

---

# Snel starten

```txt
bot help
bot status
bot smart status
```

Autonome SMP-kolonist starten:

```txt
bot smart start
bot smart colony on
bot smart expansion on
bot smart status
```

Alles stoppen:

```txt
bot stop
```

---

# Basis commands

```txt
bot help
bot status
bot stop
```

| Command | Betekenis |
|---|---|
| `bot help` | Laat command help zien |
| `bot status` | Laat health/food status zien |
| `bot stop` | Stopt navigatie, jobs, brain, autonomous, village en smartbrain |

---

# SmartBrain / Autonome SMP-kolonist

## Algemeen

```txt
bot smart start
bot smart stop
bot smart status
bot smart tick
```

| Command | Betekenis |
|---|---|
| `bot smart start` | Zet de SmartBrain loop aan |
| `bot smart stop` | Zet SmartBrain uit |
| `bot smart status` | Laat rol, taak, project en voorraad zien |
| `bot smart tick` | Forceert één AI-denkcyclus |

## Verschil tussen start, colony en expansion

```txt
bot smart start
```

Zet het AI-brein aan. Dynathi gaat automatisch denken en rollen kiezen.

```txt
bot smart colony on
```

Geeft toestemming om de hoofdbasis te bouwen.

```txt
bot smart expansion on
```

Geeft toestemming om na de hoofdbasis verder uit te breiden.

Simpel gezegd:

```txt
bot smart start        = AI brein aan
bot smart colony on    = hoofdbasis bouwen toestaan
bot smart expansion on = uitbreiding toestaan
```

## SmartBrain waypoints instellen

```txt
bot smart home home
bot smart warehouse warehouse
bot smart farm farm
bot smart mine mine
bot smart lumber lumberyard
```

| Command | Betekenis |
|---|---|
| `bot smart home <waypoint>` | Zet home waypoint |
| `bot smart warehouse <waypoint>` | Zet warehouse waypoint |
| `bot smart farm <waypoint>` | Zet farm waypoint |
| `bot smart mine <waypoint>` | Zet mine waypoint |
| `bot smart lumber <waypoint>` | Zet lumberyard waypoint |

## Colony Builder

```txt
bot smart colony
bot smart colony on
bot smart colony off
```

Colony bouwvolgorde:

```txt
1. Starter Base
2. Farm Plot
3. Warehouse
4. Watchtower
```

## Expansion Planner

```txt
bot smart expansion
bot smart expansion on
bot smart expansion off
```

Expansion bouwvolgorde:

```txt
5. Animal Pen
6. Extra Farm
7. Extra Storage
```

## Territory / Outpost

De code heeft Territory support via SmartBrain status en outpost waypoint.

Belangrijkste waypoint:

```txt
bot waypoint set outpost
```

Status controleren:

```txt
bot smart status
```

Territory bouwvolgorde:

```txt
8. Outpost Base
9. Outpost Farm
10. Outpost Storage
```

> Let op: als je aparte `bot smart territory on/off` commands wilt, moeten die nog in `commandHandler.js` gekoppeld worden. De SmartBrain module heeft de functies al.

---

# Rollen van de autonome kolonist

Dynathi kiest automatisch rollen:

```txt
Survivor           = veiligheid / lage health
Sleeper            = nacht / bed zoeken
Farmer             = voedsel regelen
Lumberjack         = hout en materialen verzamelen
Miner              = steen verzamelen
Crafter            = tools maken
Warehouse Manager  = inventory opslaan
Builder            = projecten bouwen
Outpost Builder    = outpost bouwen
Colonist           = onderhoud en wachten
```

Status bekijken:

```txt
bot smart status
```

---

# Waypoints

## Waypoint opslaan

```txt
bot waypoint set home
bot waypoint set warehouse
bot waypoint set farm
bot waypoint set mine
bot waypoint set lumberyard
bot waypoint set outpost
```

## Waypoints bekijken

```txt
bot waypoint list
```

## Naar waypoint lopen

```txt
bot waypoint goto home
bot goto home
bot goto warehouse
bot goto farm
bot goto mine
bot goto lumberyard
bot goto outpost
```

## Waypoint verwijderen

```txt
bot waypoint remove home
bot waypoint delete home
```

Aanbevolen SmartBrain waypoints:

```txt
home
warehouse
farm
mine
lumberyard
outpost
```

---

# Navigation

```txt
bot goto 100 64 -200
bot goto home
bot follow JouwNaam
bot stop
```

| Command | Betekenis |
|---|---|
| `bot goto <x> <y> <z>` | Loop naar coördinaten |
| `bot goto <waypoint>` | Loop naar waypoint |
| `bot follow <speler>` | Volg een speler |
| `bot stop` | Stop navigatie en alle actieve AI systemen |

---

# Mining

```txt
bot mine stone 5
bot mine coal_ore 3
bot mine iron_ore 3
bot mine dirt 10
```

Format:

```txt
bot mine <blocknaam> <aantal>
```

Voorbeelden:

```txt
bot mine stone 12
bot mine cobblestone 20
bot mine coal_ore 5
```

---

# Woodcutting

```txt
bot chop 10
bot wood 10
```

| Command | Betekenis |
|---|---|
| `bot chop <aantal>` | Hak logs in de buurt |
| `bot wood <aantal>` | Zelfde als chop |

---

# Fishing

```txt
bot fish
```

Laat de bot één keer vissen.

---

# Farming

```txt
bot farm wheat 20
bot farm carrot 20
bot farm potato 20
bot farm beetroot 20
bot farm sugar_cane 20
```

Format:

```txt
bot farm <crop> <aantal>
```

Ondersteunde crops hangen af van de module en aanwezige farmblokken.

---

# Storage / Chests

## Chest commands

```txt
bot chest store
bot chest dump
bot chest take oak_log 64
```

| Command | Betekenis |
|---|---|
| `bot chest store` | Slaat geselecteerde items op in chest |
| `bot chest dump` | Dumpt inventory in chest |
| `bot chest take <item> <aantal>` | Pakt item uit chest |

## Shulker commands

```txt
bot shulker store
bot shulker dump
bot shulker take diamond 1
```

---

# WarehouseAI

```txt
bot warehouse report
bot warehouse status
bot warehouse store
bot warehouse storecat wood
bot warehouse storecat ores
bot warehouse storecat food
bot warehouse storecat tools
bot warehouse build oak_planks 11 5
```

Korte aliases:

```txt
bot wh report
bot wh store
bot wh build oak_planks 11 5
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

# Crafting

```txt
bot craft chest 1
bot craft furnace 1
bot craft stone_pickaxe 1
bot craft stone_axe 1
bot craft shield 1
```

Format:

```txt
bot craft <itemnaam> <aantal>
```

Tip: plaats een crafting table dichtbij de bot.

---

# Building

## Simpele build module

```txt
bot build floor oak_planks 5 5
bot build wall oak_planks 5 3
```

## BaseBuilder

```txt
bot base starter oak_planks
bot base small oak_planks
bot base hut oak_planks 7 4
bot base house oak_planks 9 5
bot base platform oak_planks 9 9
bot base warehouse oak_planks 11 5
bot base storehouse oak_planks 11 5
bot base farm oak_planks 9
bot base farmplot oak_planks 9
bot base pen oak_fence 9
bot base animalpen oak_fence 9
bot base tower oak_planks 8
bot base watchtower oak_planks 8
```

Let op: bouwen werkt het beste op vlak terrein.

---

# VillageBuilder

```txt
bot village start oak_planks
bot village stop
bot village status
```

VillageBuilder bouwt:

```txt
Town Square
Starter House
Farm Plot
Animal Pen
Watchtower
```

---

# Explorer

```txt
bot explore
bot explore random
bot explore forest
bot explore cave
bot explore ore
bot explore water
bot explore village
bot explore farm
bot explore chest
```

| Command | Betekenis |
|---|---|
| `bot explore` | Random explore |
| `bot explore <target>` | Explore naar doeltype |

---

# Autonomous Mode oude module

```txt
bot auto start
bot auto stop
bot auto status
bot autonomous start
bot autonomous stop
bot autonomous status
```

> SmartBrain is nieuwer en slimmer. Gebruik meestal `bot smart start` in plaats van `bot auto start`.

---

# AI Brain oude module

```txt
bot brain
bot brain start
bot brain stop
```

> SmartBrain is de nieuwste hoofd-AI. `brain` is de oudere eenvoudige brain module.

---

# Jobs

```txt
bot job wood
bot job mine stone
bot job fish
bot job farm wheat
bot job status
bot job stop
```

| Command | Betekenis |
|---|---|
| `bot job wood` | Start herhalende wood job |
| `bot job mine <block>` | Start herhalende mine job |
| `bot job fish` | Start herhalende fish job |
| `bot job farm <crop>` | Start herhalende farm job |
| `bot job status` | Bekijk actieve job |
| `bot job stop` | Stop job |

---

# Survival

```txt
bot eat
bot status
bot sleep
bot sleep force
bot sleep wake
```

| Command | Betekenis |
|---|---|
| `bot eat` | Eet voedsel uit inventory |
| `bot status` | Health/food status |
| `bot sleep` | Slaap in dichtstbijzijnde bed als het nacht is |
| `bot sleep force` | Forceer bed zoeken/slapen |
| `bot sleep wake` | Wakker worden |

---

# Combat

```txt
bot attack
bot attack 6
bot guard
bot guard 8
```

| Command | Betekenis |
|---|---|
| `bot attack` | Val dichtstbijzijnde mob aan binnen standaard range |
| `bot attack <range>` | Val mob aan binnen range |
| `bot guard` | Voer guard check uit |
| `bot guard <range>` | Guard check met range |

---

# Economy

```txt
bot balance
bot bal
bot sell
bot sellall
bot shop
bot ah
bot pay SpelerNaam 1000
```

| Command | Betekenis |
|---|---|
| `bot balance` / `bot bal` | Check saldo via server command |
| `bot sell` | Verkoop inventory via server sell command |
| `bot sellall` | Quick sell |
| `bot shop` | Open shop |
| `bot ah` | Open auction house |
| `bot pay <speler> <bedrag>` | Betaal speler |

---

# Discord commands

Gebruik in Discord dezelfde commands, maar met `!bot` ervoor.

Voorbeelden:

```txt
!bot help
!bot status
!bot smart status
!bot smart start
!bot smart colony on
!bot smart expansion on
!bot waypoint list
!bot warehouse report
```

---

# Aanbevolen testvolgorde

## 1. Bot reageert?

```txt
bot help
bot status
```

## 2. Waypoints zetten

```txt
bot waypoint set home
bot waypoint set warehouse
bot waypoint set farm
bot waypoint set mine
bot waypoint set lumberyard
bot waypoint set outpost
bot waypoint list
```

## 3. Materiaal geven

```txt
/give Dynathi bread 32
/give Dynathi stone_pickaxe 1
/give Dynathi stone_axe 1
/give Dynathi oak_planks 1024
/give Dynathi oak_fence 256
/give Dynathi cobblestone 256
/give Dynathi chest 32
/give Dynathi crafting_table 8
```

## 4. SmartBrain status check

```txt
bot smart status
```

## 5. Start de autonome kolonist

```txt
bot smart start
bot smart colony on
bot smart expansion on
bot smart status
```

## 6. Laat hem draaien en check

```txt
bot smart status
```

Let op:

```txt
Role
Task
Project
Busy
Last action
Last skipped
```

---

# Noodcommands

Als de bot vastloopt:

```txt
bot stop
```

Als hij niet reageert na een GitHub update:

```bash
git pull
npm install
npm start
```

Als hij kicked wordt met `[object Object]`, moet de kick logger nog mooier gemaakt worden zodat de echte reden zichtbaar wordt.

---

# Notities

- Test bouwen eerst op superflat of vlak terrein.
- Zet altijd waypoints voordat je SmartBrain start.
- Gebruik genoeg materialen tijdens de eerste test.
- Herstart de bot na elke code-update.
- SmartBrain is de nieuwste AI. `auto` en `brain` zijn oudere systemen.
