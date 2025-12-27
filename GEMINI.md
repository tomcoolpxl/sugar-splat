# Sugar Splash - Project Context

## Project Overview

**Sugar Splash** is a polished match-3 puzzle game built with **Phaser 3**. It features a complete game loop with 20 levels, diverse objectives (Score, Clear Jelly, Locked Tiles), special candy combinations, and a robust hint system.

**Current Status:** Alpha / Late Development
**Latest Review:** [Code Review (Dec 27, 2025)](docs/code_review.md)
**Roadmap:** [Project Roadmap](docs/roadmap.md)

## Tech Stack & Architecture

*   **Engine:** Phaser 3 (v3.80.1 via CDN).
*   **Language:** Modern JavaScript (ES6 Modules).
*   **Audio:** Custom `SoundManager` utilizing procedural WebAudio synths.
*   **State Management:**
    *   `GameScene`: Game loop, HUD, Input watchdog.
    *   `Board`: Grid state, Rendering, Interaction handling.
    *   `MatchLogic`: Core algorithms (BFS for matches, intersection detection).
    *   `ActionProcessor`: Async animation sequencer for cascades.
*   **Persistence:** `localStorage` for level unlocking, stars, and settings.

### Directory Structure

```
sugar-splat/
├── index.html              # Entry point
├── src/
│   ├── Config.js           # Global constants
│   ├── main.js             # Phaser Game Config
│   ├── data/
│   │   └── LevelData.js    # Level configurations (1-20)
│   ├── scenes/             # Boot, Menu, LevelSelect, Game
│   ├── objects/            # Board, Candy
│   └── systems/            # MatchLogic, ActionProcessor, SoundManager
├── docs/
│   ├── code_review.md      # Latest technical audit
│   └── roadmap.md          # Future features and tech debt
└── assets/                 # (Procedurally generated assets used mostly)
```

## Implemented Mechanics

*   **Match-3 Core:** Swap, Match-3, Cascades, Gravity.
*   **Special Candies:** Line Clearer (4), Bomb (T/L), Color Bomb (5).
*   **Combos:** Special + Special interactions (e.g., Color Bomb + Line Clearer).
*   **Blockers:** Jelly (Single/Double), Cages (Locked Tiles).
*   **Objectives:** Target Score, Clear Jelly, Collect Colors, Drop Ingredients.
*   **Polish:** Particle effects, Squash & Stretch animations, Hint system.

## Documentation & Plans

*   **[Roadmap](docs/roadmap.md):** The source of truth for upcoming tasks (Features, Tech Debt, Polish).
*   **[Code Review](docs/code_review.md):** Detailed analysis of current architectural health.
*   **[Design Document](docs/plans/2025-12-26-sugar-splash-design.md):** Original game design specification.

## Usage

**Running the Game:**
Requires a local web server (due to ES Modules).
```bash
# Python
python -m http.server 8000
# Node
npx serve .
```
