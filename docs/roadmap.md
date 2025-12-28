# Sugar Splash Roadmap

## Completed

### Core Gameplay
- [x] Match-3 mechanics with swap validation
- [x] Cascades with combo multipliers
- [x] Special candies (Line, Bomb, Color Bomb)
- [x] Special + Special combo effects
- [x] Blockers (Jelly single/double, Locked tiles)
- [x] Multiple objective types (Score, Jelly, Collect, Drop)
- [x] 20 levels with progressive difficulty

### Systems
- [x] ActionProcessor with error recovery
- [x] Config centralization in Config.js
- [x] Procedural WebAudio (music + SFX)
- [x] C64Sequencer for menu chiptune music
- [x] Powerup system with rewards
- [x] Bonus round (moves to specials)
- [x] Hint system with dual-candy highlighting
- [x] Tutorial overlays
- [x] Settings dialogs (Menu & Level Select)

### Architecture (Refactored Dec 2025)
- [x] GameScene split into focused managers
- [x] PowerupManager - powerup UI & activation
- [x] DialogManager - win/lose/pause/tutorial dialogs
- [x] BonusRoundManager - end-of-level bonus
- [x] HUDManager - score, moves, progress
- [x] HintManager - idle hint display
- [x] ParticleManager - particle effects

### Polish
- [x] Particle effects (candy colors, jelly, specials)
- [x] Invalid swap shake + red tint
- [x] Mobile swipe controls
- [x] Sound/music toggles
- [x] Scene lifecycle cleanup
- [x] Color bomb laser beam effect
- [x] Score counter animation (counting up with pop effect)
- [x] Animated menu/level select screens
- [x] Hint system cycles visibility (show/hide)

---

## Future Enhancements

### Features
- [ ] More levels (21-40)
- [ ] New blocker types (ice, chocolate spreader)
- [ ] Daily challenges
- [ ] High score leaderboards (local)

### Polish
- [ ] Improved in-game music quality (less repetitive)
- [ ] More particle variety
- [ ] Screen shake options

### Low Priority
- [ ] Level data externalization to JSON
- [ ] Accessibility improvements (more colorblind patterns)
