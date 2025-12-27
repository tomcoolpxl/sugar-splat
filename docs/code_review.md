# Code Architecture

**Last Updated:** December 2025

## Overview

Sugar Splash is a Phaser 3 match-3 game using ES6 modules. The codebase follows a manager pattern where GameScene orchestrates specialized manager classes.

## Architecture

### File Structure

```
src/
├── Config.js               # Centralized configuration (colors, audio, timings)
├── main.js                 # Phaser game initialization
├── data/
│   └── LevelData.js        # Level definitions (20 levels)
├── objects/
│   ├── Board.js            # Grid state, rendering, input handling
│   └── Candy.js            # Individual candy sprites with special types
├── scenes/
│   ├── BootScene.js        # Asset generation (procedural textures)
│   ├── MenuScene.js        # Title screen
│   ├── LevelSelectScene.js # Level grid with progress
│   └── GameScene.js        # Main gameplay orchestration (~520 lines)
├── systems/
│   ├── ActionProcessor.js  # Async cascade sequencing with error recovery
│   ├── MatchLogic.js       # BFS matching, intersection detection
│   ├── SoundManager.js     # WebAudio procedural synth (music + SFX)
│   ├── PowerupManager.js   # Powerup UI, activation, rewards
│   ├── DialogManager.js    # Modal dialogs (win/lose/pause/tutorial)
│   ├── BonusRoundManager.js# End-of-level bonus round
│   ├── HintManager.js      # Idle hint system
│   └── ParticleManager.js  # Particle effects
└── ui/
    └── HUDManager.js       # Score, moves, progress bar, objectives
```

### Manager Pattern

Each manager follows a consistent pattern:

```javascript
export default class XxxManager {
    constructor(scene, ...dependencies) {
        this.scene = scene;
        // Initialize state
    }

    create() { /* Build UI if needed */ }

    // Public methods...

    destroy() {
        // Cleanup timers, tweens, references
        this.scene = null;
    }
}
```

### Key Patterns

1. **Async/Await Cascades** - ActionProcessor handles match-3 chain reactions with proper sequencing
2. **Event-Driven Updates** - Score, objectives, UI update via Phaser events
3. **Procedural Generation** - All textures and sounds generated at runtime (no external assets)
4. **Composition** - GameScene composes managers rather than inheriting behavior

### Data Flow

```
User Input → Board → ActionProcessor → Events → Managers → UI Updates
                ↓
           MatchLogic (match detection)
                ↓
           Candy sprites (visual state)
```

## Technical Decisions

### Procedural Assets
All textures created with Phaser Graphics API, sounds with WebAudio oscillators. Reduces load time and external dependencies.

### Manager Extraction
GameScene was refactored from ~1920 lines to ~520 lines by extracting:
- PowerupManager (482 lines)
- DialogManager (381 lines)
- HUDManager (330 lines)
- BonusRoundManager (256 lines)
- ParticleManager (120 lines)
- HintManager (109 lines)

### Error Recovery
ActionProcessor uses try/catch/finally with re-entrancy protection. 10-second watchdog timer as last resort backup.

### Mobile Support
Touch input with swipe detection. Threshold-based gesture recognition distinguishes taps from swipes.
