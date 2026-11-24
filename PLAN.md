# Overhaul plan (branch `overhaul`)

Status as of 2026-11-24. Bot numbers are in BALANCE.md.

## Phase 0: tooling (done)
- [x] `CLAUDE.md` with the standing rules (generated files, models.json, Spanish parity, never push main).
- [x] `tools/run-bot.mjs`: headless balance runner (`npm run bot`), table output, JSON dump. `tools/bot.js` records per-dawn economy, per-night wave info and what damaged the keep.
- [x] `tools/shot.mjs`: day, night and fight screenshots at desktop and phone sizes (`npm run shots`), and a report of console warnings.

## Phase 1: economy and balance (done, one problem open)
- [x] Counting houses: cost 6 wood, 4 stone, 4 gold (was 4 wood, 2 stone). Pays 4 gold + up to 2 for neighbors (was 5 + 3); each one after the second pays half. The ledger line says so.
- [x] The keep becomes a real place to spend gold: Castle opens at Village (was Town) for 40 gold; Citadel opens at Town (was City) for 100 gold. Help and rank-up text updated in both languages.
- [x] Warlord nights bring a band 20% smaller; the warlord himself is the threat.
- [x] Last Stand: the first time in a night the keep drops to a third of its health, its archers fire twice as fast for 12 seconds and soldiers heal fully. Announced in both languages.
- [ ] **Open: warlord nights still decide most games.** Ideas, best first:
  1. Make warlord nights hit harder but end less suddenly: give the keep a little armor on boss nights (each leaker does 1 less damage, minimum 1).
  2. Grow the keep's health a little each season (+2 every 5 days), so the castle isn't the only answer.
  3. Have the warlord's rally speed up only raiders near him (radius 2), not the whole band.
  These change how the game feels, so playtest one at a time.
- [ ] **Open: Merchant path is the weakest at turning gold into defense.** Ideas: Sellsword contracts hire 1 guard per 20 gold (was 30), or let the Merchant Guild sell tower upgrades for gold.

## Phase 2: pacing, court and feedback (done)
- [x] Court choices can now have lasting effects (new Ink function `over(what, amount, days)`). They show in the ledger as "Sister Maren (4 dawns left)" and count toward mood, and dawn says when one ends.
- [x] Lady Varenne, the orphans and the hooded envoy now have multi-dawn consequences instead of one-off bumps.
- [x] The orphans and the envoy now come back later (`orphans_return`, `envoy_return`), like the other five visitors. English and Spanish both written and compiling.
- [x] The night report has an "At dawn" section: change in gold, food, villagers and mood, the biggest ledger lines behind each, and warnings for next dawn.
- [x] Scouts warn a day before each warlord night and say what he does.
- [ ] Not done: campaign event pacing in `17-campaign.js`. The bot clears events without playing them, so it can't measure lulls. Next step: log which day has no petition, request, trader, audience or demand waiting, then fill gaps.
- [ ] Pre-existing: ledger line text (for example "Taxes: 9 workers") is English even in Spanish mode.

## Phase 3: visuals (done, needs a look on a real GPU)
- [x] Faint red ring under every raider, brighter at night. One shared material, no extra lights.
- [x] Night is less of a single lavender wash: a darker, less saturated sky fill and stronger torch pools around the keep and towers.
- [x] Soft vignette on the board so the eye settles on the center (CSS on the HUD canvas, no rendering cost).
- [x] Readable cost tag on the "Raise the castle" button.
- [ ] Checked only in software rendering (SwiftShader). Colors and glow will look somewhat different on a real GPU.
- [ ] Not done: the README still says three.js r128. It is r162.

## Playtest checklist before merging to main
1. Play Normal to night 10. Does the scouts' warning on day 9 help? Does the Last Stand fire, and does it feel earned or cheap?
2. Raise the castle as soon as you're a Village. Is 40 gold the right cost?
3. Take the Merchant path. Do counting houses still feel worth building?
4. Meet Sister Maren or the envoy, choose, and watch the ledger line count down. Then wait for their return visit.
5. Look at a night fight on your phone. Can you spot raiders without the health bars?
6. Switch to Spanish and repeat 4.
