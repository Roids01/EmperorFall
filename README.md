# Small Crown

A minimalist kingdom build-and-defend game in a low-poly desert canyon. Ride your hero out to build by day, grow a village economy, then hold the keep against raiders through the night.

**Play it:** https://smallcrown.netlify.app/

Runs in any modern browser. No build step.

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

three.js r128 and its glTF loader and bloom passes load from the jsDelivr and cdnjs CDNs.

## How to play

- **Day:** pick a build tool and tap tiles; your hero rides to each spot and builds it. Drag with the palisade or trap tool to lay a line. Right-click to move the hero, or steer with W A S D.
- **Economy:** villagers live in the keep and houses, pay 1 gold in taxes and eat 1 food each dawn, and work farms, lumber camps, mines and the market.
- **Night:** ring the bell. Raiders follow the red dotted routes and smash anything in the way. Watchtowers, catapults, soldiers and your hero fight back.
- **Damage:** hurt buildings smoke and burn; tap one and choose Repair, or let dawn patch it slowly.
- **Goal:** hold the keep through 20 nights, then keep going in endless mode. Pick Easy, Normal or Hard at the start; your score counts nights, kills, villagers, buildings and upgrades.
- **Hero abilities:** Charge (Q) dashes through raiders; Rally (E) pulls every soldier to the hero and makes them fight harder.
- **Growth:** quests teach the basics and pay out goods, and twelve kingdom upgrades improve your economy, defenses, army and hero.
- **Raiders:** bandits, runners, brutes, archers who shoot from range, battering rams that smash buildings, and a warlord every fifth night.

The full rules and key bindings are in the "How to rule" panel in the game.

## Credits

See [CREDITS.md](CREDITS.md).
