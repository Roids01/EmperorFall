# Small Crown

A minimalist kingdom build-and-defend game in a low-poly desert canyon. Ride your hero out to build by day, grow a village economy, then hold the keep against raiders through the night.

**Play it:** https://smallcrown.netlify.app/

Runs in any modern browser, in English or Spanish. No build step. On the live site you can install it as an app and play offline after the first visit.

## Play locally

The game loads its models with `fetch`, so open it through a local web server rather than double-clicking the file:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

The live site deploys from this repository on Netlify, with no build command and the publish directory set to the repository root. Any other static host works the same way.

## Layout

| Path | What it is |
|---|---|
| `index.html` | The whole game: markup, styles and script |
| `models/models.json` | Every 3D model, bundled as base64 glTF binaries keyed by name |
| `models/canyon_palette.png` | The palette texture recolored to desert rust and cream for the cliffs |
| `models/waternormals.png` | Tileable normal map for the sea at Saltreach Cove |
| `manifest.webmanifest`, `icons/` | App name and icons for installing the game |
| `sw.js` | Workbox service worker that caches the game for offline play |

three.js r128 and every library load from the jsDelivr and cdnjs CDNs, pinned to exact versions.

## How to play

- **Day:** pick a build tool and tap tiles; your hero rides to each spot and builds it. Drag with the palisade or trap tool to lay a line. Right-click to move the hero, or steer with W A S D.
- **Economy:** villagers live in the keep and houses, pay 1 gold in taxes and eat 1 food each dawn, and work farms, lumber camps, mines and the market.
- **Night:** ring the bell. Raiders follow the red dotted routes and smash anything in the way. Watchtowers, catapults, soldiers and your hero fight back.
- **Damage:** hurt buildings smoke and burn; tap one and choose Repair, or let dawn patch it slowly.
- **Goal:** hold the keep through 20 nights, then keep going in endless mode. Pick Easy, Normal or Hard at the start; your score counts nights, kills, villagers, buildings and upgrades.
- **Hero abilities:** Charge (Q) dashes through raiders; Rally (E) pulls every soldier to the hero and makes them fight harder.
- **Growth:** quests teach the basics and pay out goods, and twelve kingdom upgrades improve your economy, defenses, army and hero.
- **Raiders:** bandits, runners, brutes, archers who shoot from range, battering rams that smash buildings, shamans who heal the others, and a warlord every fifth night. Some nights bring a blood moon.
- **Seasons and weather:** spring, summer, harvest and winter turn every 5 days and change farm output and heating; rain, sandstorms and snow change how a night plays.
- **Mood:** wells, shrines and full granaries keep villagers content and paying extra taxes; hunger, cold and losses make them leave.
- **Hero levels:** felling raiders earns experience, and each level brings a perk choice.
- **The realm:** from day 3 your scouts find Saltreach Cove on the coast. Open the realm map (M) to ride between The Valley and the cove. Each dawn announces which region the night's raid will strike; a region without your hero defends itself. Lose the cove's fort and raiders plunder your stores; lose the valley's keep and the kingdom falls.
- **Harbor and trade:** build harbors on the cove's shore to fish and berth ships, then send voyages to four foreign ports for gold, spices and iron. Longer voyages pay more and risk more. Pirates land from the sea.
- **Ironpeak Pass:** a third region, found on day 7. Its mines dig iron, avalanches can bury buildings in winter, and from day 9 raiders come down from the north.
- **Iron, blacksmith, tavern and roads:** iron comes from the pass and from Ironhold. A blacksmith forges arms and plate, a tavern lifts the mood and hires sellswords for a night, and roads speed up your hero and add 1 to the farms, lumber camps and mines beside them.
- **Naval defense:** a lighthouse weakens pirates as they land, and warships built at the harbor sail out to sink pirate boats before they reach the shore.
- **Story and goals:** five chapters across the 20 nights, 16 achievements, and a daily challenge where everyone gets the same valley and the same twist for the day.
- **Look:** a tilt-shift, color-graded finish on High graphics, golden-hour dusks and dawns, drifting cloud shadows, swaying palms and pines, surf along the cove, and buildings that rise out of scaffolding.
- **Townsfolk:** villagers with names, jobs and opinions go about their day. Farmers hoe, woodcutters chop, miners dig, fishers fish, smiths hammer and merchants call out their wares, then carry the goods home. Children play, elders pray at the shrine, water carriers fetch from the well, friends stop to chat, and when the mood is high people dance by the keep. Chickens, dogs, goats and crabs wander about, chimneys smoke, laundry flaps, and road lamps light up at dusk. When the bell rings, everyone runs for home. In Ride mode, tap a villager to hear what they think.
- **Requests, traders and feasts:** villagers ask for things (a well, roads, a manor, a full granary) with a three-day deadline; a wandering trader sometimes sells rare goods by the keep; and once a season you can hold a feast from the keep.
- **More raiders:** wolf packs in Ironpeak Pass raids, sappers from night 10 that blow up what they reach, and pirate captains who lead some cove raids and carry a sea chest of gold.
- **Reports and tools:** a night report at each dawn shows who felled what, a Chronicle keeps every message, Repair all fixes the whole region in one tap, and houses can be raised into manors for two more villagers.
- **Edicts:** proclaim up to two laws (three from day 10), such as Conscription, Rationing, Long shifts or Night watch. Each one helps somewhere and costs somewhere else.
- **Neighbors:** the Sand Wolves, the Red Brotherhood and the Iron Clans each raid their own region. Their hostility sets how big and how frequent their raids are. Send gifts, win cleanly or kill their champions to calm them, sign trade pacts once they're calm, and decide whether to pay when they demand tribute.
- **Hero gear and tower paths:** warlords and pirate captains drop a choice of weapons, armor and charms for your hero. Watchtowers at level 3 become either ballistas or fire-arrow towers.
- **The throne:** your realm rises from hamlet to village, town, city and capital as it earns renown from clean defenses, slain champions, feasts, requests and petitions. Set taxes from low to crushing, appoint a royal council (steward, marshal, treasurer, chaplain, spymaster) with skills, traits and loyalty, answer a petition most days, and raise the keep into a castle and then a citadel.
- **Save slots and language:** three kingdoms can be saved side by side, and the EN/ES button switches the interface to Spanish.

- **Phones and tablets:** steer the hero with the on-screen joystick; a full-screen button appears where the browser supports it.
- **Music:** tap the sound button once for effects, twice for a generated day and night soundtrack.

The full rules and key bindings are in the "How to rule" panel in the game, which also restarts the guided tour.

## Credits

See [CREDITS.md](CREDITS.md).
