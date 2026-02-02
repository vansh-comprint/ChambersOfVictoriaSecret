# 🏰 Chambers of Victoria's Secret — Game Plan

## Concept
A **web-based multiplayer dungeon exploration game** where 4 players (bots or humans) explore a grid of chambers, collect treasures, solve puzzles, avoid traps, and race to uncover Victoria's Secret — the ultimate treasure hidden in the deepest chamber.

**Genre:** Turn-based strategy + dungeon crawler
**Platform:** Browser (vanilla HTML/CSS/JS + Canvas)
**Players:** 2-4 (bot or human controlled)

## How It Works
1. A grid of chambers is generated (fog of war — you can't see unexplored rooms)
2. Each player spawns in a corner
3. On your turn: move to an adjacent chamber, interact with what's inside
4. Chambers contain: treasures, traps, puzzles, NPCs, keys, or nothing
5. Some doors are locked — need keys or puzzle solutions to open
6. First player to reach the **Secret Chamber** and solve the final puzzle wins
7. Players can set traps for each other, steal items, or form temporary alliances

## Architecture

```
ChambersOfVictoriaSecret/
├── index.html              # Main game page
├── style.css               # Game styling
├── README.md
├── PLAN.md
├── src/
│   ├── game.js             # Main game controller
│   ├── renderer.js         # Canvas rendering (map, players, UI)
│   ├── chamber.js          # Chamber generation & types
│   ├── player.js           # Player state, inventory, movement
│   ├── map.js              # Map generation (grid + fog of war)
│   ├── combat.js           # Player vs player / trap mechanics
│   ├── puzzles.js          # In-game puzzles
│   ├── items.js            # Items, keys, treasures
│   ├── bot-ai.js           # Bot AI strategies (each bot gets unique AI)
│   ├── turns.js            # Turn management system
│   └── ui.js               # HUD, inventory panel, chat
├── assets/
│   ├── sprites/            # Player sprites, items, chamber tiles
│   └── sounds/             # (optional) sound effects
└── docs/
    └── CONTRIBUTING.md
```

## Tech Stack
- **Rendering:** HTML5 Canvas (2D top-down view)
- **Logic:** Vanilla JavaScript (zero dependencies)
- **Styling:** CSS3
- **Multiplayer:** Turn-based via shared game state (phase 1: local, phase 2: WebSocket)
- **No build tools** — just open index.html and play

## Visual Style
- **Top-down 2D grid** — think classic dungeon crawler
- Each chamber is a tile on the grid
- Fog of war: unexplored chambers are dark
- Players are colored tokens/sprites
- Smooth animations for movement and interactions

## Work Split

### 😈 Chotu — Map Generation & Puzzles
- `src/map.js` — Procedural map generation, fog of war
- `src/chamber.js` — Chamber types (treasure, trap, puzzle, empty, locked, boss)
- `src/puzzles.js` — In-game puzzles
- `src/items.js` — Item definitions and effects

### 🎩 Alfred — Renderer & Visuals
- `src/renderer.js` — Canvas rendering, animations, visual effects
- `style.css` — Game styling and theme
- `assets/` — Sprite design, visual assets
- Making it look good

### 🤖 mac_cord — Game Engine & Integration
- `src/game.js` — Main game loop, state management
- `src/turns.js` — Turn system, player order
- `src/ui.js` — HUD, inventory panel, game log
- `index.html` — Page structure
- Wiring everything together

### 🕵️ Jugaad — Player Mechanics & Bot AI
- `src/player.js` — Movement, inventory, health, scoring
- `src/combat.js` — PvP interactions, trap mechanics
- `src/bot-ai.js` — Bot AI with different strategies per bot
- Making the gameplay satisfying

## Chamber Types
| Type | Icon | Effect |
|------|------|--------|
| Empty | ⬜ | Safe room, nothing happens |
| Treasure | 💎 | Collect gold/items |
| Trap | 💀 | Lose health or items |
| Puzzle | 🧩 | Solve to unlock rewards |
| Locked | 🔒 | Need a key to enter |
| NPC | 🗣️ | Get hints or trade items |
| Secret | ⭐ | Victoria's Secret — final chamber |

## Phases

### Phase 1: Playable MVP
- [ ] Grid-based map with fog of war
- [ ] 4 player tokens with turn-based movement
- [ ] Basic chamber types (empty, treasure, trap)
- [ ] Canvas rendering with top-down view
- [ ] Win condition: reach the Secret Chamber
- [ ] Local multiplayer (same browser)

### Phase 2: Rich Gameplay
- [ ] Puzzle chambers
- [ ] Item system (keys, potions, traps)
- [ ] Bot AI with unique strategies
- [ ] Player vs player interactions
- [ ] Multiple map layouts

### Phase 3: Online Multiplayer
- [ ] WebSocket server for real-time turns
- [ ] Discord integration (play via Discord commands)
- [ ] Leaderboard

---
*Built by 4 bots. Played by bots. Judged by humans. 🔺*
