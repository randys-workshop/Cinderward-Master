# CINDERWARD — The Dying Flame

An original, fully self-contained pixel RPG in the browser. Inspired by the *feel* of
classic GBA-era RPGs (open overworld, turn-based party battles, collectible spirit
companions) and MMO-style questing and gear — but with **100% original names, art,
code, story, and music**. No third-party assets. See `LEGAL.md`.

## Play

Double-click `index.html` (works offline from `file://`), or serve the folder:

```bash
cd Cinderward-Master
python3 -m http.server 8080
# open http://localhost:8080
```

Everything is procedural — sprites, tiles, and chiptune audio are generated in code.
The pixel font (Press Start 2P, OFL) is embedded as base64. No network needed.

## Controls

| Action | Keys |
|---|---|
| Move | WASD / Arrow keys |
| Run | hold Shift |
| Interact / Confirm | Z, Enter, or Space |
| Menu / Back | X or Esc |
| Gear & appearance | C |
| Cindren (party) | B |
| Bag | I |
| Quest journal | Q |
| Mute | M |

In battle: ↑/↓ choose, Z confirm, X back. Menus also support mouse clicks.

## The game

- **World**: Emberwick village → the Emberwood overworld → the Granary Cellar →
  Hollowmere Depths. Day/night cycle, lantern glow, fireflies, drifting embers.
- **Story**: The First Flame is dying. The Ashen Covenant steals its living fragments
  — the **Cindren** — to rekindle a dead god and crown themselves in its light.
  12 quests (5 main + 7 side) with `!`/`?` markers, a journal, and tracking.
- **Cindren**: 18 species across 8 elements. Weaken wild ones, then **Bind** them with
  a rune sigil (a ritual — *no thrown object*). Starters evolve at Lv 16.
- **Battle**: turn-based, your Warden + up to 3 Cindren. Aether **Arts** cost EP.
  Elemental type chart. **Bonded** Cindren lend passive stat auras; **Rouse** two of the
  same element to unleash a **Confluence** summon. Statuses, crits, stages, loot.
- **Customization**: a deep character creator (build, skin, 6 hairstyles × 8 colors,
  eyes, tunic style/color, trim, pants, boots, cape, accessory, name). On top of that,
  **13 gear slots** (weapon, offhand, head, shoulders, chest, hands, waist, legs, feet,
  back, neck, ring, trinket) drop from beasts and **render visually on your sprite**.
  Six rarity tiers. Hide any slot's visual WoW-style. Re-customize at the Warden's Mirror.
- **Progression**: XP, level-ups, move learning, evolution, gear stats, gold shards,
  shops, inn rest/save. 3 save slots + autosave (localStorage).

## Architecture

Plain scripts (no modules, no build step) so it runs from `file://`:

```
index.html
css/style.css        pixel UI chrome + embedded font
js/data.js           elements, moves, species, gear, items, quests, NPCs, shops
js/sprites.js        procedural hero (13 gear layers), Cindren, tiles
js/world.js          maps, collision, transitions, encounters, events
js/engine.js         input, loop, camera, render, day/night, particles, audio
js/battle.js         hybrid turn-based combat
js/ui.js             dialogue, menus, creator, shop, title, battle panel
js/main.js           state, stats, quest engine, save/load, boot
assets/pixel.woff2   source font (also embedded in CSS)
```

Global namespace `SB`; game state in `SB.G`.

## iOS path (later)

The engine is deliberately portable: pure Canvas + DOM, no `eval`, no remote deps,
localStorage persistence, fixed 480×320 logical stage scaled to fit. To ship on iOS,
wrap with Capacitor (or a WKWebView shell), add a touch D-pad + action buttons that
emit the same key events, and persist saves to the filesystem instead of localStorage.
No rendering or game-logic changes required. **Run a formal trademark clearance on the
name before any commercial release** (see LEGAL.md).
