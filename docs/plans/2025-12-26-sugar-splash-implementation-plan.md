# Sugar Splash - Implementation Plan

This document outlines the step-by-step implementation plan for Sugar Splash. Each phase builds on the previous one, allowing for testing and validation at each stage.

---

## Phase 1: Project Setup & Foundation

### Step 1.1: Initialize Project Structure
- Create folder structure (src/, assets/, etc.)
- Create index.html with Phaser CDN link
- Create main.js with basic Phaser config
- Set up responsive scaling (Phaser.Scale.FIT)
- Test: Game canvas renders with solid color background

### Step 1.2: Create Scene Scaffolding
- Create BootScene.js (placeholder, transitions to Menu)
- Create MenuScene.js (placeholder with "Play" text)
- Create LevelSelectScene.js (placeholder)
- Create GameScene.js (placeholder)
- Set up scene transitions
- Test: Can navigate between all scenes

### Step 1.3: Create Placeholder Assets
- Generate 6 candy sprites (colored shapes) using Phaser Graphics or simple PNGs
- Create UI button graphics
- Create background gradient
- Test: Assets load and display correctly

---

## Phase 2: Core Board & Rendering

### Step 2.1: Board Data Structure
- Create Board.js class
- Implement 8×8 grid data structure (2D array)
- Store candy type per cell (0-5 for 6 types)
- Add methods: getCell(), setCell(), isEmpty()
- Test: Board initializes with random candy types

### Step 2.2: Board Rendering
- Create Candy.js sprite class
- Render board as grid of candy sprites
- Position candies based on grid coordinates
- Implement coordinate conversion (grid ↔ screen position)
- Apply fluid scaling based on screen size
- Test: 8×8 board renders centered on screen

### Step 2.3: Initial Board Generation
- Implement random board generation
- Add constraint: no initial matches of 3+ on board creation
- Test: Generated boards have no pre-existing matches

---

## Phase 3: Input & Swapping

### Step 3.1: Tile Selection
- Add click/tap detection on candies
- Highlight selected candy visually
- Track currently selected candy
- Deselect on second tap of same candy
- Test: Can select and deselect candies

### Step 3.2: Swap Detection
- Detect when second candy is selected
- Validate adjacency (must be horizontal or vertical neighbor)
- If not adjacent, switch selection to new candy
- Test: Adjacent pairs are detected correctly

### Step 3.3: Swap Animation
- Implement swap tween (150ms)
- Animate both candies swapping positions
- Update board data structure after animation
- Lock input during animation
- Test: Candies visually swap and data updates

### Step 3.4: Invalid Swap Revert
- After swap animation, check if match was created
- If no match: animate swap reverting
- Test: Invalid swaps bounce back

---

## Phase 4: Match Detection & Clearing

### Step 4.1: Match Detection System
- Create MatchDetector.js
- Implement horizontal match detection (3+ in a row)
- Implement vertical match detection (3+ in a column)
- Return array of matched cell coordinates
- Test: Correctly identifies all matches on board

### Step 4.2: Match Clearing
- Animate matched candies (scale down + fade, 200ms)
- Remove candies from board data
- Mark cells as empty
- Add particle effect on clear
- Test: Matched candies disappear with animation

### Step 4.3: Validate Swap Creates Match
- Before confirming swap, check if it creates a match
- Only allow swaps that result in at least one match
- Integrate with swap revert logic
- Test: Only valid swaps are allowed

---

## Phase 5: Gravity & Refill

### Step 5.1: Gravity (Falling Tiles)
- Create BoardFiller.js
- After matches clear, drop tiles down to fill gaps
- Animate falling (100ms per cell, ease-out bounce)
- Update board data as tiles fall
- Test: Tiles fall to fill empty spaces

### Step 5.2: Spawn New Tiles
- Generate new candies at top of columns
- Animate new candies falling in from above board
- Ensure no immediate matches on spawn (where possible)
- Test: Empty cells at top are filled with new candies

### Step 5.3: Cascade Detection
- After gravity + refill, check for new matches
- If new matches exist, clear them and repeat
- Track cascade depth for scoring
- Continue until no more matches
- Lock input during entire cascade sequence
- Test: Chain reactions work correctly

---

## Phase 6: Scoring & HUD

### Step 6.1: Score Manager
- Create ScoreManager.js
- Implement base scoring (10 points per tile)
- Implement combo multiplier (1.5× per cascade level)
- Track current score
- Test: Scores calculate correctly

### Step 6.2: Gameplay HUD
- Add top bar: level number, moves remaining
- Add bottom bar: score display, pause button
- Style HUD elements
- Test: HUD displays and updates

### Step 6.3: Move Counter
- Decrement moves on each valid swap
- Display current moves in HUD
- Test: Move counter decreases correctly

---

## Phase 7: Objectives & Win/Lose

### Step 7.1: Level Data Structure
- Create levels.json with level definitions
- Define: moves allowed, objectives, board layout (optional)
- Start with 5 simple score-target levels
- Test: Level data loads correctly

### Step 7.2: Objective System
- Create ObjectiveManager.js
- Implement score target objective
- Display objective in HUD (icon + target)
- Track progress toward objective
- Test: Objective progress updates correctly

### Step 7.3: Win Condition
- Detect when objective is complete
- Show "Level Complete" overlay
- Display stars earned (based on moves remaining)
- "Next Level" button
- Test: Winning a level works correctly

### Step 7.4: Lose Condition
- Detect when moves = 0 and objective not complete
- Show "Out of Moves" overlay
- "Retry" button (restarts same level)
- Test: Losing and retrying works correctly

---

## Phase 8: Special Tiles

### Step 8.1: Line Clearer Creation
- Detect 4-in-a-row matches
- Create line clearer special tile instead of normal clear
- Visual: striped candy (horizontal or vertical based on match direction)
- Test: Matching 4 creates line clearer

### Step 8.2: Line Clearer Activation
- When line clearer is matched or swapped: clear entire row/column
- Animate line clearing effect
- Score bonus for tiles cleared
- Test: Line clearers activate correctly

### Step 8.3: Bomb Creation
- Detect 5-in-a-row or T/L shapes
- Create bomb special tile
- Visual: wrapped/glowing candy
- Test: Matching 5 or T/L creates bomb

### Step 8.4: Bomb Activation
- When bomb is matched or swapped: clear 3×3 area
- Animate explosion effect
- Score bonus for tiles cleared
- Test: Bombs activate correctly

### Step 8.5: Special + Special Combos
- When two specials are swapped together: enhanced effect
- Line + Line = cross clear (row AND column)
- Bomb + anything = larger explosion
- Test: Special combos work correctly

---

## Phase 9: Blockers

### Step 9.1: Jelly Blocker
- Add jelly layer data to board (separate from candy data)
- Render jelly behind candies (translucent overlay)
- Jelly clears when match happens on that cell
- Add "Clear all jelly" objective type
- Test: Jelly renders and clears correctly

### Step 9.2: Double Jelly
- Jelly with 2 layers (needs 2 matches to clear)
- Visual: darker jelly for layer 2
- Test: Double jelly requires 2 hits

### Step 9.3: Locked Tiles
- Add locked state to candy data
- Render cage/lock overlay on candy
- Locked candies cannot be swapped
- Adjacent match unlocks the candy
- Test: Locked tiles work correctly

---

## Phase 10: Additional Objectives

### Step 10.1: Collect Candies Objective
- Track specific candy type clears
- Display in HUD: candy icon + count needed
- Multiple candy types can be required
- Test: Collect objective tracks correctly

### Step 10.2: Drop Items Objective
- Add "dropper" items (e.g., cherries) to board
- Items fall with gravity but cannot be matched
- Item reaching bottom row = collected
- Display in HUD: item icon + count needed
- Test: Drop items work correctly

### Step 10.3: Combined Objectives
- Support multiple objectives per level
- All objectives must be complete to win
- Display all objectives in HUD
- Test: Combined objectives work correctly

---

## Phase 11: Menus & Level Select

### Step 11.1: Main Menu Polish
- Add "Sugar Splash" title graphic
- Style "Play" button
- Add sound toggle button
- Add gradient background
- Test: Menu looks polished

### Step 11.2: Level Select Screen
- Create scrollable grid of level buttons
- Display level number on each button
- Display star rating (0-3 stars)
- Show lock icon for locked levels
- Display total stars at top
- Test: Level select works correctly

### Step 11.3: Pause Menu
- Add pause button to GameScene
- Pause overlay: Resume, Restart, Quit, Sound toggle
- Pause game state while overlay is open
- Test: Pause menu works correctly

---

## Phase 12: Save System

### Step 12.1: LocalStorage Save
- Save on level complete: level unlocked, stars earned, best score
- Save on settings change: sound on/off
- Load on game start
- Test: Progress persists across browser sessions

### Step 12.2: Level Unlock Logic
- Level 1 always unlocked
- Completing level N unlocks level N+1
- Level select respects unlock state
- Test: Progression works correctly

---

## Phase 13: Audio

### Step 13.1: Synth Sound Polishing
- Refine `SoundManager.js` synth parameters for all actions.
- Implement sounds: select, swap, invalid, match, cascade.
- Implement sounds: level complete, level fail, button click.
- Test: Sounds play at correct moments and feel cohesive.

### Step 13.2: Procedural Background Music (Optional)
- Explore generating a simple looping melody using WebAudio.
- Test: Music complements the synth SFX.

### Step 13.3: Audio Controls
- Implement mute toggle (saves to localStorage).
- Apply mute state on game load.
- Test: Mute toggle works correctly.

---

## Phase 14: Hints

### Step 14.1: Hint System
- After 5 seconds idle, find a valid move
- Highlight the two candies with pulsing glow
- Only active on tutorial/new-mechanic levels
- Test: Hints appear after idle

### Step 14.2: Valid Move Detection
- Implement findValidMove() function
- Check all possible swaps for matches
- Return first valid swap found
- Test: Always finds a valid move if one exists

---

## Phase 15: Board Safety

### Step 15.1: Prevent Stuck Boards
- After refill, verify at least one valid move exists
- If no valid moves: auto-reshuffle with animation
- Test: Board never gets stuck

### Step 15.2: Smart Tile Generation
- When spawning new tiles, prefer tiles that create valid moves
- Reduce chance of immediate deadlocks
- Test: Stuck boards are rare

---

## Phase 16: Polish & Juice

### Step 16.1: Animation Polish
- Add bounce easing to tile landing
- Add subtle squash/stretch on select
- Add screen shake on big combos
- Test: Animations feel satisfying

### Step 16.2: Particle Effects
- Pop particles on match
- Sparkle trail on falling tiles
- Explosion particles for specials
- Limit to ~50 particles for performance
- Test: Particles enhance feedback without lag

### Step 16.3: Combo Display
- Show "×2!", "×3!" etc. during cascades
- Animate combo text (scale up, fade out)
- Test: Combos are visually celebrated

---

## Phase 17: Level Design

### Step 17.1: Design Levels 1-5
- Score target objectives only
- 30 moves each
- No blockers
- Hints on levels 1-2
- Test: Levels are completable and fun

### Step 17.2: Design Levels 6-10
- Introduce jelly
- Collect + clear jelly objectives
- 25-30 moves
- Hints on level 6
- Test: Jelly mechanic is clear

### Step 17.3: Design Levels 11-15
- Introduce drop items
- Mixed objectives
- 20-25 moves
- Hints on level 11
- Test: Drop items work well

### Step 17.4: Design Levels 16-20
- Introduce locked tiles (level 12 introduces, use more here)
- Double jelly on level 18+
- Combined objectives
- 15-20 moves
- Test: Difficulty is challenging but fair

---

## Phase 18: Testing & Refinement

### Step 18.1: Playtest All Levels
- Play through all 20 levels
- Note any frustrating or boring moments
- Adjust move counts and objectives
- Test: All levels are fun and fair

### Step 18.2: Mobile Testing
- Test on iOS Safari
- Test on Chrome Android
- Verify touch controls work
- Verify scaling looks good
- Test: Mobile experience is solid

### Step 18.3: Performance Testing
- Test on lower-end devices
- Verify 60 FPS during cascades
- Optimize if needed
- Test: No performance issues

---

## Phase 19: Final Polish

### Step 19.1: README
- Write setup instructions
- Document code structure
- List all features
- Test: README is helpful

### Step 19.2: Final Asset Pass
- Replace any placeholder graphics if desired
- Ensure consistent visual style
- Test: Game looks polished

### Step 19.3: Bug Fixes
- Fix any remaining issues found during testing
- Test: Game is stable and complete

---

## Summary

| Phase | Focus | Key Deliverable |
|-------|-------|-----------------|
| 1 | Setup | Project structure, scenes |
| 2 | Board | Rendering, data structure |
| 3 | Input | Selection, swapping |
| 4 | Matching | Detection, clearing |
| 5 | Gravity | Falling, refill, cascades |
| 6 | Scoring | Points, HUD, moves |
| 7 | Objectives | Win/lose conditions |
| 8 | Specials | Line clearers, bombs |
| 9 | Blockers | Jelly, locked tiles |
| 10 | More Objectives | Collect, drop items |
| 11 | Menus | Main menu, level select |
| 12 | Save | LocalStorage persistence |
| 13 | Audio | Music, SFX |
| 14 | Hints | Auto-highlight system |
| 15 | Safety | Prevent stuck boards |
| 16 | Polish | Animations, particles |
| 17 | Levels | Design all 20 levels |
| 18 | Testing | Playtest, mobile, performance |
| 19 | Final | README, bug fixes |
