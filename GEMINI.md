# Sugar Splash - Project Context

## Project Overview

**Sugar Splash** is a polished match-3 puzzle game built with **Phaser 3**. It features a complete game loop with 20 levels, diverse objectives (Score, Clear Jelly, Locked Tiles), special candy combinations, and a robust hint system.

## Tech Stack & Architecture

*   **Engine:** Phaser 3 (v3.80.1 via CDN).
*   **Language:** Modern JavaScript (ES6 Modules).
*   **Audio:** Custom `SoundManager` utilizing procedural WebAudio synths for a retro-casual feel.
*   **State Management:** `GameScene` handles game loop; `Board` handles grid logic; `MatchLogic` handles algorithms.
*   **Persistence:** `localStorage` for level unlocking and settings.

### Directory Structure

```
sugar-splat/
├── index.html              # Entry point
├── src/
│   ├── Config.js           # Global constants (Colors, Speeds)
│   ├── main.js             # Phaser Game Config
│   ├── scenes/
│   │   ├── BootScene.js    # Preloader (Asset generation)
│   │   ├── MenuScene.js    # Main Menu & Settings
│   │   ├── LevelSelectScene.js # Level Grid UI
│   │   └── GameScene.js    # Main Gameplay Loop & HUD
│   ├── objects/
│   │   ├── Board.js        # Grid state, Rendering, Interaction
│   │   └── Candy.js        # Sprite class
│   └── systems/
│       ├── MatchLogic.js   # Match-3 Algorithms (Lines, T/L, Swaps)
│       ├── ActionProcessor.js # Async Board Operations (Cascades)
│       └── SoundManager.js # Audio System (Synth + File support)
├── assets/                 # (Currently empty/placeholders)
└── docs/                   # Design & Implementation plans
```

## Implemented Mechanics

### Core Gameplay
*   **Grid:** 8x8 Dynamic Board (centered and scaled).
*   **Matching:**
    *   **Match 3:** Basic clear.
    *   **Match 4:** Creates **Line Clearer** (Striped Candy).
    *   **Match 5:** Creates **Color Bomb** (Clear all of one color).
    *   **T / L Shape:** Creates **Bomb** (Area explosive).
*   **Combos (Special Interactions):**
    *   **Bomb + Bomb:** Large explosion.
    *   **Line + Line:** Cross clear (Row + Col).
    *   **Color Bomb + Any:** Turns all candies of that color into specials.
*   **Blockers:**
    *   **Jelly:** Single and Double layers (requires matching on top). Includes "breathing" animation.
    *   **Locks (Cages):** Prevents movement; requires adjacent match to break.

### UX & Polish
*   **Hint System:** Auto-detects valid moves after idle time; shows hand cursor and glow.
*   **Tutorials:** Overlay modals for new mechanics (Jelly, Locks, Double Jelly).
*   **Visuals:** Particle explosions, camera shake, squash-and-stretch animations.
*   **HUD:** Move counter, Score bar, Objective tracker (Score vs Jelly), Combo text.

### Progression
*   **Levels:** 20 Unique levels with varying difficulty and objectives.
*   **Objectives:** Target Score, Clear Jelly.
*   **Saving:** Unlocks, Stars, and High Scores saved to LocalStorage.

## Roadmap & Next Steps

### 1. Code Refactoring
*   **Level Data:** Move the hardcoded `levels` object from `GameScene.js` to `src/data/levels.json` for easier editing and external loading.
*   **Config:** Centralize remaining magic numbers (tween durations, layout offsets) into `src/Config.js`.

### 3. Final Polish
*   **Mobile Testing:** Ensure touch targets are friendly on small screens (Board scaling is already implemented).
*   **Performance:** Monitor particle count on low-end devices.

## Usage

**Running the Game:**
Requires a local web server (due to ES Modules).
```bash
# Python
python -m http.server 8000
# Node
npx serve .
```