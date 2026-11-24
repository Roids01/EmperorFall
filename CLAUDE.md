# Small Crown (EmperorFall): rules for working in this repo

## Never
- Never read or print `models/models.json` (10 MB of base64 glTF). Reference models by name only.
- Never edit the generated files at the root: `index.html`, `game.js`, `i18n-es.js`, `data/`. Edit `src/` and run `npm run build`.
- Never push to `main` while work is in progress: Netlify deploys `main` straight to https://smallcrown.netlify.app/. Use a branch and merge after a playtest.

## How the code fits together
- `src/game/*.js` are joined in numeric order into one function, `__main`, so they share one scope. A name defined in `03-…` is visible in `13-…`. `99-boot.js` closes the function.
- Several files are large (03, 04, 05, 13 are 40–60 KB). Grep for the function you need instead of reading them whole.
- `econ()` in `02-rules-economy.js` is the one source of truth for what dawn does: the ledger shows it and dawn applies it. Change income or upkeep there, not in the dawn code.
- three.js is r162, loaded as ES modules from jsDelivr (see `src/head.html`). README's "r128" is out of date.

## Spanish parity
- Any new or changed English UI string needs a matching entry in `src/i18n-es.js`.
- Any change to `src/ink/court_en.ink` needs the same change in `src/ink/court_es.ink`. The build compiles both and fails on Ink errors.

## Checks before committing
- `npm run build` must finish with no errors.
- Balance changes: `npm run bot -- --n 20` and compare against the tables in `BALANCE.md`. Add the new table there.
- First time on a machine: `npm install`, `npx playwright install chromium` (or set `CHROME=/path/to/chrome`). Offline or behind a proxy: `npm run bot:setup` mirrors the CDN libraries into `tools/.cdn/`.
- What the bot can't judge (how the game looks and feels, and the conquest, trade, wonder and union victories) needs a human playtest. Say so rather than claiming it was verified.
