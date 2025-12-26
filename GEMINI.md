# Sugar Splash - Project Context

## Project Overview

**Sugar Splash** (also referred to as "Sugar Splat" in directory structure) is a casual match-3 puzzle game built with **Phaser 3**. It features a complete game loop with menus, level selection, progression saving, and polished gameplay mechanics like cascades and special tile combos.

## Tech Stack & Architecture

*   **Engine:** Phaser 3 (v3.80.1 via CDN).
*   **Language:** Modern JavaScript (ES6 Modules).
*   **Build System:** None required. Runs directly in the browser via a local static server.
*   **Asset Management:** Currently utilizes procedural generation (Phaser Graphics) for game assets, with folder structures in place for future static assets.

### Directory Structure

```
sugar-splat/
├── index.html              # Entry point (loads Phaser + src/main.js)
├── src/
│   ├── main.js             # Game configuration & Scene list
│   ├── scenes/             # Game states
│   │   ├── BootScene.js    # Preloader & Asset generation
│   │   ├── MenuScene.js    # Main Menu
│   │   ├── LevelSelectScene.js # Level progression UI
│   │   └── GameScene.js    # Core gameplay loop
│   ├── objects/
│   │   ├── Board.js        # Grid logic, matching algorithms
│   │   └── Candy.js        # Sprite class for game pieces
│   ├── systems/            # Logic separation (planned/in-progress)
│   └── data/               # Level data storage
├── assets/                 # Static assets (images/audio/fonts)
└── docs/                   # Design documentation & plans
```

## Key Mechanics

*   **Grid:** 8x8 match-3 board.
*   **Matching:** Swap adjacent tiles to form lines of 3+.
*   **Specials:**
    *   **Match 4:** Line Clearer (Row/Col).
    *   **Match 5 / T / L:** Bomb (3x3 area).
    *   **Combos:** Special tiles interact (e.g., Bomb + Bomb = 5x5 explosion).
*   **Blockers:** Jelly (single/double layer), Locked Tiles (cages).
*   **Progression:** 20 levels, star rating system (1-3 stars based on moves left), LocalStorage save.

## Development & Usage

### Running the Game

Since the project uses ES Modules, it must be served via a web server to avoid CORS errors with local file access.

**Using Python:**
```bash
python -m http.server 8000
# Open http://localhost:8000
```

**Using Node (npx):**
```bash
npx serve .
# Open provided URL
```

**Using VS Code:**
Use the "Live Server" extension.

### Code Style & Conventions

*   **Modules:** All code uses ES6 `import`/`export`.
*   **Classes:** Game objects and Scenes extend Phaser classes (`Phaser.Scene`, `Phaser.GameObjects.Sprite`).
*   **State Management:** Game state (current level, scores) is often passed between scenes via the `data` object in `scene.start()`.
*   **Assets:** Most visual elements are currently drawn programmatically in `BootScene.js` using `make.graphics()`.

## Documentation

*   **Design Doc:** `docs/plans/2025-12-26-sugar-splash-design.md` - Detailed gameplay specs.
*   **Implementation Plan:** `docs/plans/2025-12-26-sugar-splash-implementation-plan.md` - Tracking progress.
