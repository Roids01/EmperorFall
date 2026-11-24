# Balance runs

Made with `npm run bot` (see `tools/run-bot.mjs`). Each row is 20 headless games played by `tools/bot.js`. With 20 games, a win rate is only accurate to about ±11 points, so treat small differences as noise.

**What the bot measures:** the valley defense up to day 20 (The Long Watch), plus the economy along the way.
**What it doesn't:** conquest, trade, wonders and the union of crowns. It never moves armies, signs pacts or builds wonders, so those victories need a person to playtest.

Strategies: `balanced` (Holy path), `b_merchant` and `b_warlord` (the same build on the other two paths, to compare paths fairly), `turtle` (Warlord, heavy walls), `economy` (Merchant, few defenses), `random` (taps randomly, a floor).
Columns: "broke" = under 5 gold at the end. "Lost on warlord nights" = share of losses that happened on night 10, 15 or 20.

## 1. Baseline, original game and original bot

| diff | strategy | win | avg day reached | broke (gold<5 at end) | avg end gold | avg pop | gold d5 / d10 / d20 | net gold/dawn d10 / d20 | avg keep dmg/night | worst night dmg | lost by day | errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| easy | balanced | 75% | 19.9 | 0% | 167 | 38.9 | 0.18 | 30 / 42 / 86 | 15.9 / 54.5 | 0.18 | 10.0 | 16.4 | 0 |
| easy | turtle | 80% | 20.3 | 0% | 179 | 27.8 | 0.15 | 38 / 41 / 81 | 9.7 / 25.3 | 0.15 | 10.0 | 17.3 | 0 |
| easy | economy | 60% | 19.8 | 0% | 260 | 31.8 | 0.35 | 30 / 65 / 184 | 25.6 / 59.2 | 0.35 | 10.0 | 17.9 | 0 |
| easy | random | 0% | 14.2 | 5% | 74 | 8.1 | 0.88 | 41 / 47 / 37 | 7.2 / 2.8 | 0.88 | 10.0 | 14.2 | 0 |
| normal | balanced | 80% | 19.9 | 0% | 184 | 30.7 | 0.22 | 39 / 60 / 81 | 12.5 / 43.1 | 0.22 | 10.0 | 15.3 | 0 |
| normal | turtle | 60% | 20.4 | 0% | 184 | 27.4 | 0.31 | 27 / 36 / 81 | 9.8 / 24.0 | 0.31 | 10.0 | 19.4 | 0 |
| normal | economy | 50% | 19.3 | 0% | 271 | 32.3 | 0.49 | 28 / 67 / 174 | 24.4 / 63.3 | 0.49 | 10.0 | 17.5 | 0 |
| normal | random | 0% | 12.3 | 0% | 77 | 5.3 | 1.04 | 44 / 56 / 0 | 5.0 / 0.0 | 1.04 | 10.0 | 12.3 | 0 |
| hard | balanced | 45% | 17.8 | 0% | 161 | 26.1 | 0.56 | 41 / 49 / 86 | 12.8 / 46.0 | 0.56 | 10.0 | 15.1 | 0 |
| hard | turtle | 65% | 19.5 | 0% | 206 | 23.8 | 0.31 | 28 / 61 / 70 | 9.3 / 24.3 | 0.31 | 10.0 | 16.7 | 0 |
| hard | economy | 5% | 16.9 | 0% | 158 | 22.1 | 0.80 | 37 / 88 / 123 | 22.8 / 53.3 | 0.80 | 10.0 | 16.6 | 0 |
| hard | random | 0% | 10.7 | 0% | 75 | 4.5 | 1.16 | 48 / 49 / 0 | 4.9 / 0.0 | 1.16 | 10.0 | 10.7 | 0 |

## 2. Original game, bot plays more like a person

The bot now raises the keep when it can and spends spare gold on goods and towers. This is the fair "before" for the changes below.

| diff | strategy | win | avg day reached | broke (gold<5 at end) | avg end gold | avg pop | gold d5 / d10 / d20 | net gold/dawn d10 / d20 | avg keep dmg/night | worst night dmg | lost by day | errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| normal | balanced | 65% | 19.8 | 0% | 189 | 33.0 | 0.34 | 48 / 42 / 99 | 13.8 / 42.8 | 0.34 | 10.0 | 17.6 | 0 |
| normal | turtle | 85% | 20.9 | 0% | 200 | 32.9 | 0.17 | 30 / 32 / 67 | 10.0 / 27.8 | 0.17 | 10.0 | 20.0 | 0 |
| normal | economy | 65% | 18.5 | 0% | 193 | 29.4 | 0.37 | 30 / 59 / 137 | 24.8 / 62.6 | 0.37 | 12.0 | 13.9 | 0 |
| hard | balanced | 45% | 18.3 | 0% | 158 | 28.9 | 0.50 | 42 / 49 / 97 | 13.4 / 48.8 | 0.50 | 10.0 | 16.1 | 0 |
| hard | turtle | 45% | 18.4 | 0% | 228 | 21.6 | 0.46 | 31 / 63 / 165 | 8.9 / 21.7 | 0.46 | 10.0 | 16.3 | 0 |
| hard | economy | 10% | 15.4 | 0% | 145 | 19.3 | 0.75 | 39 / 83 / 142 | 20.9 / 57.7 | 0.75 | 16.0 | 14.8 | 0 |

## 3. After the changes on branch `overhaul`

| diff | strategy | win | avg day reached | broke (gold<5 at end) | avg end gold | avg pop | gold d5 / d10 / d20 | net gold/dawn d10 / d20 | avg keep dmg/night | worst night dmg | lost by day | lost on warlord nights | errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| normal | balanced | 65% | 20.0 | 0% | 131 | 36.3 | 40 / 39 / 68 | 14.1 / 44.2 | 0.38 | 10.0 | 18.1 | 86% | 0 |
| normal | b_merchant | 45% | 17.9 | 0% | 127 | 25.3 | 50 / 62 / 84 | 18.7 / 45.3 | 0.50 | 10.0 | 15.3 | 73% | 0 |
| normal | b_warlord | 75% | 20.4 | 0% | 191 | 29.8 | 41 / 57 / 64 | 10.4 / 28.8 | 0.25 | 12.0 | 18.4 | 60% | 0 |
| normal | turtle | 75% | 20.3 | 0% | 206 | 25.9 | 33 / 40 / 100 | 9.4 / 21.8 | 0.28 | 10.0 | 18.0 | 100% | 0 |
| normal | economy | 35% | 18.2 | 0% | 156 | 27.3 | 37 / 79 / 83 | 20.6 / 48.8 | 0.48 | 10.0 | 16.7 | 77% | 0 |
| hard | balanced | 45% | 19.1 | 0% | 135 | 31.1 | 41 / 39 / 71 | 14.0 / 42.2 | 0.49 | 16.0 | 17.6 | 64% | 0 |
| hard | b_merchant | 45% | 17.5 | 0% | 143 | 22.8 | 45 / 105 / 72 | 16.6 / 44.8 | 0.57 | 10.0 | 14.6 | 82% | 0 |
| hard | b_warlord | 45% | 18.6 | 0% | 185 | 25.2 | 39 / 53 / 85 | 9.6 / 25.2 | 0.46 | 10.0 | 16.5 | 73% | 0 |
| hard | turtle | 45% | 18.6 | 0% | 157 | 24.6 | 40 / 46 / 51 | 9.8 / 26.7 | 0.39 | 10.0 | 16.5 | 55% | 0 |
| hard | economy | 20% | 15.4 | 0% | 148 | 18.4 | 36 / 102 / 77 | 16.9 / 43.6 | 0.78 | 10.0 | 14.1 | 69% | 0 |

## What the numbers say

- **Warlord nights decide the game.** In every run, 55–100% of losses happen on nights 10, 15 and 20, and the keep goes from full to zero in one night. Logging what hit the keep on those nights shows the warlord rarely touches it himself. The ordinary raiders, runners, brutes and sappers he hurries along do the damage. Shrinking his band by 20% and adding the Last Stand did not measurably change this. **Still open; see PLAN.md.**
- **Gold piled up with nothing to buy.** Before, a Normal game ended with 180–270 gold and was earning +45–63 a dawn by day 20. One Merchant building, the counting house (4 wood and 2 stone for 5–8 gold a dawn forever), supplied about 22 of that. After the changes, ending gold is 130–200, and the castle is a real way to spend it.
- **No bankruptcies and no runtime errors** in any run, before or after.
- **Paths:** with the same build, Warlord wins the most on Normal (70–75%) and Merchant the least (40–45%). Merchant makes the most gold but has the weakest way to turn it into defense.
