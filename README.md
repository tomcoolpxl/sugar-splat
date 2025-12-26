# Sugar Splash

A relaxing match-3 puzzle game built with Phaser 3.

## Quick Start

Start a local server in the project directory:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (npx)
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` (or the port shown) in your browser.

## Game Features

### Core Gameplay
- 8x8 match-3 board with 6 candy types
- Swap adjacent candies to create matches of 3+
- Chain reactions (cascades) with combo multipliers
- Move-limited levels with score targets
- 20 levels with progressive difficulty

### Visual Polish
- Distinct candy shapes for accessibility (circle, square, diamond, star, triangle, hexagon)
- Particle effects on matches
- Smooth animations (swap, fall, pop)
- Combo text for cascades
- Progress bar for objectives

### Game Flow
- Win/lose screens with star ratings (1-3 stars)
- Level select with progress tracking
- Local save (localStorage) persists progress
- Pause menu with restart/quit options
- Sound toggle

### Hint System
- Auto-highlights valid moves after 5 seconds idle
- Only active on tutorial levels (1, 2, 6, 11, 12)

## Project Structure

```
sugar-splash/
├── index.html              # Entry point
├── src/
│   ├── main.js            # Phaser configuration
│   ├── scenes/
│   │   ├── BootScene.js   # Asset generation & loading
│   │   ├── MenuScene.js   # Main menu
│   │   ├── LevelSelectScene.js
│   │   └── GameScene.js   # Main gameplay
│   ├── objects/
│   │   ├── Board.js       # Grid logic, matching, cascades
│   │   └── Candy.js       # Individual candy sprite
│   ├── systems/           # (Future: separate systems)
│   └── data/              # (Future: level JSON)
├── assets/                # (Currently generated in code)
└── docs/plans/            # Design documents
```

## Controls

- **Click/tap** a candy to select it
- **Click/tap** an adjacent candy to swap
- Swaps only work if they create a match of 3+
- Invalid swaps animate and revert

## Scoring

- 10 points per candy cleared
- Cascade multiplier: 1.5x per cascade level
- Stars based on moves remaining:
  - 1 star: Complete the level
  - 2 stars: Complete with 40%+ moves left
  - 3 stars: Complete with 60%+ moves left

## Technical Notes

- Phaser 3.80.1 (CDN)
- No build tools required
- Assets generated procedurally (Graphics API)
- Responsive scaling (320x480 to 1920x1080)
- Mobile-friendly touch controls

## What's Implemented

- [x] Core match-3 mechanics
- [x] Swap validation
- [x] Match detection (horizontal + vertical)
- [x] Gravity/falling tiles
- [x] Cascade chain reactions
- [x] Scoring with combo multipliers
- [x] 20 levels with varied objectives
- [x] Win/lose conditions
- [x] Star rating system
- [x] Level progression & save
- [x] Particle effects
- [x] Hint system (tutorial levels)
- [x] Pause menu
- [x] Sound toggle
- [x] **Special tiles (line clearers, bombs)**
- [x] **T/L shape detection for bombs**
- [x] **Special + special combo effects**
- [x] **Jelly blockers (single & double layer)**
- [x] **Locked tiles**
- [x] **Clear Jelly objective type**

## Special Tiles

| Match Pattern | Creates | Effect |
|---------------|---------|--------|
| 4 in a row | Line Clearer | Clears entire row or column |
| 5 in a row | Bomb | Clears 3x3 area |
| T or L shape | Bomb | Clears 3x3 area |

### Special Combos

| Combo | Effect |
|-------|--------|
| Line H + Line V | Cross clear (row + column) |
| Bomb + Bomb | Large 5x5 explosion |
| Bomb + Line | 3 rows or 3 columns cleared |
| Line + Line (same) | Cross clear |

Special tiles can be:
- Swapped deliberately to activate
- Activated automatically when matched
- Chain-react when caught in another special's blast

## Blockers

| Blocker Type | Appearance | Behavior |
|--------------|------------|----------|
| Jelly (Single) | Light pink square | Clears when a match occurs on that cell |
| Jelly (Double) | Darker pink with border | Requires 2 matches to clear (becomes single, then clears) |
| Locked Tile | Ice cage overlay | Cannot be selected or swapped; unlocks when adjacent match occurs |

Jelly levels have a "Clear Jelly" objective - clear all jelly to win!

## Future Enhancements

- [ ] Additional objective types (collect, drop items)
- [ ] Sound effects & music
- [ ] More levels with varied mechanics
