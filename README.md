# EmperorFall

A minimalist kingdom build-and-defend game in a low-poly desert canyon (working title in-game: *Small Crown*). Ride your hero out to build by day, grow a village economy, then hold the keep against raiders through the night.

Runs in any modern browser. No build step.

## Play locally

The game loads its models with `fetch`, so open it through a local web server rather than double-clicking the file:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

Any static host works. On Netlify, connect this repository with no build command and the publish directory set to the repository root.

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

The full rules and key bindings are in the "How to rule" panel in the game.

## Credits

See [CREDITS.md](CREDITS.md).
