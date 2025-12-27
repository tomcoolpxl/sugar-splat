# Sugar Splash Roadmap

## Completed

### Core Systems ✅
- [x] **Input Locking Reliability:** ActionProcessor hardened with try/catch/finally, re-entrancy protection
- [x] **Config Centralization:** All magic numbers moved to `Config.js`
- [x] **Audio Safety:** Shared AudioContext, browser autoplay handling
- [x] **Grid/Sprite Sync:** clearingCells tracking, active checks prevent ghost candies
- [x] **Scene Lifecycle:** Proper shutdown cleanup, null safety on UI elements

### Visual Polish ✅
- [x] **Particle Effects:** Distinct particles for candy (colored), jelly (pink), bombs (orange), lines (cyan)
- [x] **Animation Curves:** Back.easeOut for snappier swaps
- [x] **Invalid Swap Feedback:** Pronounced shake + red tint flash

### Features ✅
- [x] **Level Progression:** Unlocking system based on completing previous levels
- [x] **Tutorials:** Overlay system for introducing new mechanics (Jelly, Locked tiles)

---

## In Progress

### Audio
- [ ] **Music Quality:** Replace current music with happy, unobtrusive chiptune melodies

---

## Future Enhancements

### Features
- [ ] **Mobile Optimization:** CSS/Canvas scaling for various mobile aspect ratios
- [ ] **Persistent Settings:** Save volume levels (not just mute toggle) to localStorage
- [ ] **High Score Leaderboards:** Local leaderboards per level
- [ ] **Daily Rewards:** Simple system to reward returning players

### Polish
- [ ] **UI Feedback:** Score counter counting up animation, progress bar milestones
- [ ] **Accessibility:** Colorblind patterns (partially implemented with candy shapes)

### Low Priority
- [ ] **Level Data:** Externalize to JSON (current JS object is fine for now)
