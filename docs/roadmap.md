# Sugar Splash Roadmap

This document outlines the development roadmap, current technical debt, and planned polish items for Sugar Splash.

## 🚀 Features

### Planned
- [ ] **Mobile Optimization:** Comprehensive testing and CSS/Canvas scaling adjustments for various mobile aspect ratios.
- [ ] **Persistent Settings:** Save more user preferences (e.g., specific volume levels, not just mute toggles) to `localStorage`.
- [ ] **High Score Leaderboards:** Local or simple backend-based leaderboards per level.
- [ ] **Daily Rewards:** Simple system to reward returning players.

### In Progress
- [x] **Level Progression:** Unlocking system based on completing previous levels (Basic implementation in `LevelSelectScene`).
- [x] **Tutorials:** Overlay system for introducing new mechanics (Implemented for Jelly, Locked tiles).

## 🛠️ Tech Debt & Architecture

### Core Systems
- [ ] **Input Locking Reliability:** The `GameScene` relies on a "watchdog" timer to force unlock input if it gets stuck. This is a band-aid solution. The `ActionProcessor` async flow needs a robust state machine to guarantee `inputLocked` is always released naturally.
- [ ] **Match Logic Edge Cases:** `MatchLogic.js` needs unit testing or rigorous manual testing for edge cases (e.g., simultaneous special candy activations, complex cascades) to ensure 100% accuracy.
- [ ] **Grid/Sprite Synchronization:** Ensure `Board.js` logic for `grid` (data) and `candies` (visuals) is tightly coupled to prevent "ghost" candies or visual glitches during rapid play.

### Code Quality
- [ ] **Config Centralization:** Continue moving magic numbers (animation durations, physics values, colors) from `GameScene.js`, `Board.js`, and `SoundManager.js` into `src/Config.js`.
- [ ] **Phaser API Updates:** Audit codebase for deprecated Phaser 3 methods (e.g., legacy particle emitter syntax) to ensure compatibility with v3.80+.
- [ ] **Scene Lifecycle Management:** rigorous checks on `shutdown()` methods to ensure all Events, Tweens, and Timers are destroyed to prevent memory leaks and "zombie" scene logic.

### Dependency Management
- [ ] **Asset Loading:** Review `BootScene.js` to balance between procedurally generated textures and external assets. Consider implementing a texture atlas for UI elements if they grow in number.

## ✨ Polish & UX

### Visuals
- [ ] **Particle Effects:** Enhance particle variety for different interactions (e.g., distinct particles for Jelly clear vs. Candy clear).
- [ ] **Animation Curves:** Refine tween easings (using `Back.easeOut` vs `Sine.easeInOut`) for snappier and more "juicy" candy movements.
- [ ] **UI Feedback:** Add more "juice" to the HUD (score counter counting up, progress bar flashing on milestones).

### Audio
- [ ] **Sound Manager Robustness:** Ensure `SoundManager.js` handles browser Auto-Play policies gracefully across all devices.
- [ ] **Audio Feedback:** Differentiate sounds more clearly (e.g., distinct sounds for "Invalid Move" vs "Locked Tile").

### User Experience
- [ ] **Error Handling:** Implement graceful error recovery for critical game states (e.g., if a valid move is calculated but fails to execute).
- [ ] **Accessibility:** improved visual contrast for colorblind modes (using shapes/patterns in addition to color, which is partially implemented).
