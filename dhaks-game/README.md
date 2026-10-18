# For Dhaks — Part 1

Opening → YES/NO (with the funny NO sequence) → cinematic transition → "Choose Your World" with four story cards.

## Run
Open `index.html`, or serve the folder (`npx serve` / `python3 -m http.server`). Deploys to Vercel/GitHub Pages as-is (static, no build step).

## Add your files
- **Covers** → `assets/images/` named `fantasy-cover.png`, `mafia-cover.png`, `still-with-you-cover.png`, `reality-cover.png`. Until they exist, cards show a soft glowing placeholder.
- **Music** → `assets/audio/` as `opening.mp3`, `selection.mp3`, `fantasy.mp3`, `mafia.mp3`, `still-with-you.mp3`, `reality.mp3`. Missing files are silently ignored. Music starts only after her first YES/NO click.

## Where to edit things (all in the `CONFIG` block at the top of `js/script.js`)
- Opening lines → `opening`
- NO messages, button labels, shrink/dodge behaviour → `noSequence`, `maxDodges`
- Story titles, taglines, image paths, routes → `stories`
- Audio paths → `audio`

## Story pages
Placeholders live in `stories/fantasy|mafia|still-with-you|reality/index.html`. Build each story there later; start its song with `Sound.play("fantasy")` (include `script.js` or copy the `Sound` object).

Tip: `index.html#library` jumps straight to the selection screen for testing.
