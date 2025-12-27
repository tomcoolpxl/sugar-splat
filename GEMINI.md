# Sugar Splash - Project Context

## Project Overview

**Sugar Splash** is a polished match-3 puzzle game built with **Phaser 3**. It features a complete game loop with 20 levels, diverse objectives (Score, Clear Jelly, Locked Tiles), special candy combinations, and a robust hint system.

**Current Status:** Beta
**Latest Review:** [Code Review](docs/code_review.md)
**Roadmap:** [Project Roadmap](docs/roadmap.md)

## Tech Stack & Architecture

* **Engine:** Phaser 3 (v3.80.1 via CDN)
* **Language:** Modern JavaScript (ES6 Modules)
* **Audio:** Custom `SoundManager` with procedural WebAudio synths (shared AudioContext)
* **Resolution:** 720x1280 (mobile-first, scales responsively)

### Core Systems
| System | File | Purpose |
|--------|------|---------|
| Game Loop | `GameScene.js` | HUD, events, win/lose conditions |
| Grid Logic | `Board.js` | Grid state, rendering, input handling |
| Match Detection | `MatchLogic.js` | BFS matching, intersection detection |
| Animation Queue | `ActionProcessor.js` | Async cascade sequencing with error recovery |
| Audio | `SoundManager.js` | Procedural sound effects and music |

### Directory Structure

```
sugar-splat/
├── index.html
├── src/
│   ├── Config.js           # Centralized configuration (audio, animations, colors)
│   ├── main.js             # Phaser Game Config
│   ├── data/
│   │   └── LevelData.js    # Level configurations (1-20)
│   ├── scenes/             # Boot, Menu, LevelSelect, Game
│   ├── objects/            # Board, Candy
│   └── systems/            # MatchLogic, ActionProcessor, SoundManager
└── docs/
    ├── code_review.md      # Technical audit (completed items)
    └── roadmap.md          # Current and future work
```

## Implemented Mechanics

### Core Gameplay
* **Match-3:** Swap, Match-3+, Cascades, Gravity fill
* **Special Candies:** Line Clearer (4-match), Bomb (T/L shape), Color Bomb (5-match)
* **Combos:** Special + Special interactions (e.g., Color Bomb + Bomb = all candies become bombs)

### Blockers & Objectives
* **Blockers:** Jelly (single/double layer), Cages (locked tiles)
* **Objectives:** Target Score, Clear Jelly, Collect Colors, Drop Ingredients, Mixed

### Polish
* Distinct particle effects (candy colors, pink jelly, orange bombs, cyan lines)
* Squash & stretch animations
* Invalid swap shake + red tint feedback
* Hint system (5-second idle)
* Tutorials for new mechanics

## Running the Game

Requires a local web server (ES Modules):
```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

Then open `http://localhost:8000` in a browser.
