# Sugar Splash (`sugar-splat`) — Comprehensive Multi-Level Architecture, Design, Gameplay & Code Review

**Review Date:** November 2026  
**Engine / Stack:** Phaser 3.80.1 (CDN), Vanilla ES6 Modules, Procedural Graphics & WebAudio  
**Skills Applied:** `Writing Phaser 3 Games` (`.claude/skills/phaser`), `Frontend Design` (`.claude/skills/frontend-design`), `Brainstorming` (`.claude/skills/brainstorming`)  
**Status:** ✅ **ALL 14 CONFIRMED BUGS (`[BUG-01]`–`[BUG-14]`) AND ALL UX/GAMEPLAY/AUDIO ENHANCEMENTS RESOLVED**

---

## Executive Summary

**Sugar Splash** is an ambitious, zero-dependency, procedurally generated Match-3 game written in vanilla ES6 modules on top of Phaser 3.80.1. Its architectural evolution—most notably the extraction of specialized systems ([`ActionProcessor`](file:///c:/Users/thraa/github/sugar-splat/src/systems/ActionProcessor.js), [`MatchLogic`](file:///c:/Users/thraa/github/sugar-splat/src/systems/MatchLogic.js), [`HUDManager`](file:///c:/Users/thraa/github/sugar-splat/src/ui/HUDManager.js), [`DialogManager`](file:///c:/Users/thraa/github/sugar-splat/src/systems/DialogManager.js), [`PowerupManager`](file:///c:/Users/thraa/github/sugar-splat/src/systems/PowerupManager.js), [`BonusRoundManager`](file:///c:/Users/thraa/github/sugar-splat/src/systems/BonusRoundManager.js), [`HintManager`](file:///c:/Users/thraa/github/sugar-splat/src/systems/HintManager.js), [`ParticleManager`](file:///c:/Users/thraa/github/sugar-splat/src/systems/ParticleManager.js), and [`C64Sequencer`](file:///c:/Users/thraa/github/sugar-splat/src/systems/C64Sequencer.js))—shows strong engineering instincts. Having 40 levels, 12 blocker definitions, 4 powerups, a SID-inspired C64 chiptune sequencer, and procedural textures with zero external asset files is a rare achievement.

However, a deep multi-level audit reveals that **rapid feature expansion (especially Worlds 5–8, Levels 21–40) outpaced core board-state invariants**. Several headline features advertised in [`README.md`](file:///c:/Users/thraa/github/sugar-splat/README.md) and [`LevelData.js`](file:///c:/Users/thraa/github/sugar-splat/src/data/LevelData.js) are either **broken, dead code, or actively sabotaging player progression**:

1. **Star Calculation Bug:** [`BonusRoundManager.play()`](file:///c:/Users/thraa/github/sugar-splat/src/systems/BonusRoundManager.js#L56-L98) consumes up to 10 remaining moves *before* [`GameScene.showWinScreen()`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/GameScene.js#L441-L459) calculates the star rating—meaning a player actually needs **16+ moves left for 2 stars** and **21+ moves left for 3 stars**.
2. **Hardcoded 6 Candy Types:** [`GameScene.createBoard()`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/GameScene.js#L577) hardcodes `candyTypes: 6`, ignoring `this.levelConfig.candyTypes` (which specifies `4` or `5` across all 40 levels).
3. **Portals Are Unconnected Dead Code:** [`Board.getPortalExit()`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1617-L1625) and [`ParticleManager.emitPortal()`](file:///c:/Users/thraa/github/sugar-splat/src/systems/ParticleManager.js#L325-L359) are never called anywhere. Levels 39–40 render spinning portals that do nothing.
4. **Gravity Desynchronizes Blockers & Tunnels Through Stones/Chocolate:** [`Board.applyGravity()`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1730-L1774) drops candies right out of their Ice, Chains, Crates, Locks, and Bomb Timers, while [`Board.fillEmptySpaces()`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1786-L1837) spawns new candies *inside* Chocolate tiles and drops candies straight *through* Stone blocks.
5. **Conveyor Belt Array Corruption:** [`Board.processConveyors()`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1523-L1615) performs sequential pairwise swaps using stale candy references, corrupting the grid on every contiguous conveyor belt (Levels 37, 38, 40).
6. **Powerup Storage Key Mismatch:** [`LevelSelectScene.getPowerups()`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/LevelSelectScene.js#L711-L718) reads `sugarSplash_powerups` while [`PowerupManager`](file:///c:/Users/thraa/github/sugar-splat/src/systems/PowerupManager.js#L16-L40) saves inside `sugarSplash_save.powerups`, causing the Level Select inventory bar to permanently show `×0`.

| Review Dimension | Current Grade | Target Grade | Key Bottleneck |
| :--- | :---: | :---: | :--- |
| **1. Abstract Philosophy & Game Identity** | **B+** | **A** | Split personality between relaxing pastel casual puzzle and hardcore C64/arcade blocker chaos |
| **2. Gameplay & Level Design** | **C+** | **A** | Ignored `candyTypes`, broken star math, broken World 7–8 mechanics, huge move counts (40–70 moves) |
| **3. UI/UX & Aesthetic Polish** | **B** | **A** | System fonts (`Arial`), shape loss on special candies (colorblind regression), cluttered 32-level grid |
| **4. Flow, Pacing & "Juice"** | **B-** | **A+** | Hard input locking (no input buffering), flat cascade audio pitch, slow sequential awaits |
| **5. Architecture & Code Quality** | **B** | **A** | [`Board.js`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js) is a 2,254-line God Object with 22 parallel 2D arrays; no object pooling |
| **6. Bugs & Stability** | **D+** | **A** | 14 confirmed functional bugs across gravity, blockers, audio, persistence, and memory cleanup |

---

## Level 1: Abstract Thoughts & Game Identity

### 1.1 The "Relaxing vs. Punishing" Tension
In [`original_design.md`](file:///c:/Users/thraa/github/sugar-splat/docs/plans/original_design.md#L27), the core tone is defined as:
> *"Relaxing but satisfying. No timers, no lives, no pressure. Bright candy visuals with moderate animation polish."*

As the project evolved through 40 levels, it introduced **spreading Honey**, **candy-destroying Chocolate**, and **instant-lose Bomb Timers**. This creates an interesting philosophical crossroads:
- **Early Game (Worlds 1–4):** Very high move allowances (40–70 moves) and gentle targets, making it almost impossible to lose—sometimes to the point of feeling tedious (45 moves to clear 4 jellies on Level 6).
- **Late Game (Worlds 5–8):** Sudden introduction of existential board threats (85% honey lose threshold, 75% chocolate lose threshold, 10-move bomb countdowns) while the board runs 6 colors instead of 5.

### 1.2 The Procedural Aesthetic Identity
One of Sugar Splash's most charming traits is that **100% of its visuals and audio are procedural code**:
- Menu music is a genuine 3-voice PAL C64 SID-style chiptune ([`C64Sequencer.js`](file:///c:/Users/thraa/github/sugar-splat/src/systems/C64Sequencer.js)).
- In-game music is a 6-palette procedural step sequencer ([`SoundManager.js`](file:///c:/Users/thraa/github/sugar-splat/src/systems/SoundManager.js)).
- Candies, blockers, and particles are drawn via `Phaser.GameObjects.Graphics`.

**Abstract Critique:** Right now, the visual presentation sits in an uncanny valley between *"programmer placeholder art"* (Arial fonts, flat `0x000000` alpha-0.3 HUD bars, OS emojis `🍮🍒🔨💣⚙️`) and *"deliberate stylized minimalism"*. Leaning intentionally into either **Tactile Glossy Toybox** (chunky custom webfont, multi-layered candy shaders/gradients, unified vector icons) or **Demakes / Chiptune Arcade** will make the game unforgettable.

---

## Level 2: UI/UX & Visual Design Review (Applying `frontend-design` Skill)

### 2.1 Typography & Emoji Dependency
- **Generic Font Stack:** Every text object in the codebase uses `'Arial Black, Arial, sans-serif'` or `'Arial, sans-serif'`. On mobile (iOS/Android), `Arial Black` often falls back to standard system sans-serif with synthetic bolding, causing inconsistent vertical metrics and stroke clipping.
- **Cross-Platform Emoji Inconsistency:** Objectives (`🍮`, `🍒`, `🔴`, `🔵`), Powerups (`🔨`, `💣`, `⚡`, `🌈`), Tutorials (`🧊`, `⛓️`, `🪨`, `🍯`), and UI icons (`⚙️`, `🔒`, `👑`) rely on OS-rendered emojis in `this.add.text()`.
  - On Windows, Android, and iOS, emojis have different baseline offsets, widths, and color palettes.
  - In [`HUDManager.createObjectivesDisplay()`](file:///c:/Users/thraa/github/sugar-splat/src/ui/HUDManager.js#L139), collection targets use circle emojis (`🔴`, `🔵`, `🟢`, `🟡`, `🟣`, `🟠`), which do not match the **shapes** of the candies on the board (Square, Diamond, Star, Triangle, Hexagon) and can clip at the top/bottom of Phaser's text canvas.

### 2.2 Colorblind Accessibility Regression on Special Candies
- **Great Base Design:** Normal candies (`candy_0` through `candy_5` in [`BootScene.js`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/BootScene.js#L64-L90)) use 6 distinct shapes (Circle, Square, Diamond, Star, Triangle, Hexagon).
- **Critical Regression:** In [`BootScene.createSpecialTextures()`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/BootScene.js#L299-L349), all Line Clearers (`candy_${index}_line_h`, `candy_${index}_line_v`) and Bombs (`candy_${index}_bomb`) are drawn as **circles** (`graphics.fillCircle(...)`) regardless of `index`!
  - When a Blue Square (`candy_1`) or Green Diamond (`candy_2`) becomes a Line Clearer or Bomb, it **morphs into a circle**, erasing its shape identity for colorblind players and making it look like a Red Circle (`candy_0`) with a stripe.
- **Palette Similarity:** `COLORS[0]` (`0xff4757` Red), `COLORS[3]` (`0xffa502` Orange-Yellow), and `COLORS[5]` (`0xff7f50` Coral-Orange) sit dangerously close in warm hue space, especially under translucent pink Jelly (`0xff69b4`) or amber Honey (`0xffb300`).

### 2.3 Screen Layout & Spatial Composition (`720×1280`)
- **Level Select Density ([`LevelSelectScene.js`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/LevelSelectScene.js#L272-L334)):**
  - `this.levelsPerPage = 32` with `this.columns = 4` packs **8 rows of 4 buttons** into the middle of the screen.
  - Page 1 shows 32 levels (4×8 grid), while Page 2 shows only 8 levels (Levels 33–40, 2 rows) floating in the vertical center!
  - Since there are 8 distinct 5-level Worlds in [`LevelData.js`](file:///c:/Users/thraa/github/sugar-splat/src/data/LevelData.js), grouping by **World (e.g., 20 levels per page = 4 Worlds, or a World Map / World Cards)** would give visual identity to each world instead of an undifferentiated wall of 32 pink squares.
- **HUD Information Hierarchy ([`HUDManager.js`](file:///c:/Users/thraa/github/sugar-splat/src/ui/HUDManager.js)):**
  - The top bar packs `Level X`, `Moves: Y`, Pause `| |`, Objectives text, and Progress Bar into a `120px` dark rectangle (`y: 20..140`).
  - When a level has `ultimate` objectives (Levels 20, 30, 40: Jelly + Drop + 2 Collect colors + Score), `objectives.join('   ')` at `26px` font size can exceed `width - 40` (`680px`) and overflow the top bar!
  - In [`HUDManager.updateProgressBar()`](file:///c:/Users/thraa/github/sugar-splat/src/ui/HUDManager.js#L323-L348), when `objectives.score > 0` AND other objectives exist (Levels 20, 30, 40), `totalGoals` only sums `jelly + drop + collect` and **ignores `score` progress**, so the progress bar hits 100% even when the player hasn't reached `targetScore` yet!

---

## Level 3: Gameplay, Mechanics & Balance Review

### 3.1 The 6-Color Bug & Move Inflation
Because [`GameScene.createBoard()`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/GameScene.js#L577) passes `candyTypes: 6` instead of `this.levelConfig.candyTypes || 6`:
- Every level plays on an 8×8 board with 6 colors.
- Historically, [`LevelData.js`](file:///c:/Users/thraa/github/sugar-splat/src/data/LevelData.js) was tuned with huge move counts (40 to 70 moves!) likely to compensate for 6-color boards and the star-rating bug.
- **Impact on Fun:** On Level 1, the target score is `500` and moves are `40`. A player reaches `500` points in ~4–6 moves! Why does the level end immediately on move 5 with 35 moves remaining (and then cap bonus conversion at 10 moves)? Or on Level 6, the player has **45 moves** to clear **4 single-layer jelly tiles** in the center of the board (which takes ~3 moves).
- **Recommendation:** Fix `candyTypes: this.levelConfig.candyTypes || 6` in `GameScene.js`, fix the star calculation bug, and tighten move counts to 15–30 moves so every move feels meaningful and tactical rather than a 5-move win with 40 leftover moves.

### 3.2 Blocker Design & Interaction Matrix
There are currently **12 blocker mechanics** in [`Board.js`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js), several of which overlap almost identically in behavior:

| Blocker | Can Swap? | Can Match Through? | Cleared By | Gravity Behavior (Current) | Design Issue |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **Locked** (`locked`) | No | **No** | Adjacent match | Buggy (stays in place while candy falls) | Overlapping identity with Ice/Chains/Crate |
| **Ice** (`ice` 1–2) | No | Yes | Direct match / Special | Buggy (candy falls out of ice) | Identical to Chains & Crate! |
| **Chains** (`chains` 1–2) | No | Yes | Direct match / Special | Buggy (candy falls out of chains) | Identical to Ice & Crate! |
| **Crate** (`crate` 1–3) | No | Yes | Direct match / Special | Buggy (candy falls out of crate) | Tutorial says *"Candies in crates can match"*—identical to Ice & Chains! |
| **Honey** (`honey`) | No | Yes | Direct match / Special | Buggy (candy falls out of honey) | Spreads every 2 moves onto candies |
| **Chocolate** (`chocolate`) | No (No candy) | No | Adjacent match / Special | Blocks gravity (acts as floor) | `fillEmptySpaces` spawns candies inside it! |
| **Stone** (`stone`) | No (No candy) | No | Indestructible | Blocks gravity (acts as floor) | `fillEmptySpaces` drops candies through it! |
| **Jelly** (`jelly` 1–2) | Yes | Yes | Match on cell | Stays on cell (background layer) | Works well |
| **Licorice** (`licorice`) | Blocks swap across wall | Yes | Indestructible | Does not block gravity | Works, though thin visual |
| **Bomb Timer** (`bombTimer`) | Yes | Yes | Direct match / Special | Buggy (timer stays at `[r][c]` when candy falls!) | Timer doesn't follow its candy! |
| **Conveyor** (`conveyor`) | Yes | Yes | Indestructible | Moves after cascade | Sequential swap bug; doesn't trigger cascade matches after moving! |
| **Portal** (`portals`) | Yes | Yes | Indestructible | **Dead code** (never teleports) | Completely unimplemented in gravity/movement |

> [!IMPORTANT]
> **Blocker Differentiation Opportunity:** Right now, **Ice**, **Chains**, and **Crate** have the **exact same mechanical rules**: `canSwapAt() === false`, `canMatch() === true`, cleared by matching the candy inside (`handleIceAt`, `handleChainAt`, `handleCrateAt`).
> In classic Match-3 design (e.g., *Candy Crush* / *Royal Match*):
> - **Crates / Wooden Boxes** contain *no candy* and are broken by **adjacent matches** (like non-spreading Chocolate with 1–3 layers).
> - **Ice / Frosting** either locks a candy until matched OR requires adjacent matches.
> - **Chains / Locks** prevent swapping and require matching the candy inside (or adjacent matches).
> Differentiating Crate to be an **adjacent-match multi-layer obstacle** would immediately make Worlds 5, 7, and 8 feel mechanically distinct!

### 3.3 Drop Ingredients (`type >= 100`) Mechanics
1. **No Initial Spawn:** When a `drop` level starts (e.g., Level 11, 14, 18, 20, 25, 29, 30, 37, 39, 40), [`Board.fillBoard()`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1659-L1672) spawns **zero ingredients**. Ingredients only spawn inside [`Board.fillEmptySpaces()`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1806-L1808) with a `10%` random probability per empty cell!
   - If a player makes matches near the bottom of the board or has bad RNG, they can go 10+ moves without a single cherry spawning, or have a cherry spawn on their final move when it is impossible to drop it 8 rows.
2. **Column Traps Above Stones:** In [`Board.fillEmptySpaces()`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1806), an ingredient can spawn in *any* column `c`, even if column `c` has an indestructible `stone` below it (e.g., Level 25 cols 2, 3, 4, 5; Level 40 cols 0 and 7). Since candies cannot fall through stone (`Board.js:1736`) and players cannot swap across stone, an ingredient above a bottom-row stone (like `(7,7)` in Level 40!) is **permanently trapped** unless destroyed by a special/powerup!
3. **Cleared by Specials Mid-Board:** Because `clearCandies()` doesn't skip `candy.isIngredient`, a Line Clearer, Bomb, or Hammer hitting a cherry on Row 1 destroys it and increments `this.status.drop++` ([`GameScene.js:395`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/GameScene.js#L395)), bypassing the entire "drop to the bottom row" puzzle!

### 3.4 Special Candy & Combo Rules
- **Special Spawn Position ([`MatchLogic.js:164,167`](file:///c:/Users/thraa/github/sugar-splat/src/systems/MatchLogic.js#L164-L167)):** Specials always spawn at `match.cells[Math.floor(match.length / 2)]`. If a player swaps a candy at `(row, 0)` to complete a 4-match `(row, 0..3)`, the special spawns at `(row, 2)` instead of `(row, 0)` where the player's finger/cursor just moved. Passing the swapped coordinates into `findMatches(swappedCells)` so specials spawn at the user's focal point is a hallmark of responsive Match-3 design.
- **Line Clearer Direction ([`MatchLogic.js:163`](file:///c:/Users/thraa/github/sugar-splat/src/systems/MatchLogic.js#L163)):** Currently, a horizontal 4-match creates `line_h` and a vertical 4-match creates `line_v`. (Note: in *Candy Crush*, stripe direction is determined by swap direction or perpendicular to match direction; either convention is fine, but showing small directional arrows on the striped candy texture will make it 100% readable).
- **Color Bomb + Bomb / Line Combo ([`Board.js:648-663`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L648-L663)):**
  - What happens when you swap a **Color Bomb with a normal candy**? [`Board.trySwap()`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L517-L530) checks `const matches = this.findMatches()` *first*!
  - If swapping a Color Bomb with an adjacent Red candy happens to create a 3-match with the Color Bomb's old `candyType` (remember: `Candy.makeSpecial('color_bomb')` changes the texture to `'candy_color_bomb'`, **but leaves `candy.candyType` and `this.grid[row][col]` as its original color `0..5`**!), it gets treated as a normal 3-match instead of a Color Bomb activation!
  - Even worse: because `this.grid[row][col]` retains `0..5` when a candy becomes a `color_bomb`, **Color Bombs can be accidentally matched in normal 3-matches of their old color**! A Color Bomb should set `this.grid[row][col] = 99` (or special color-bomb ID) so it only activates when swapped or hit by another special.

---

## Level 4: Flow, Pacing & "Juice" (Benchmarked Against *Royal Match* & *Candy Crush*)

### 4.1 Input Locking vs. Input Buffering / Pre-Swapping
- **Current Flow:** `this.board.inputLocked = true` blocks all pointer interaction from the start of a swap until every cascade, gravity drop, refill, blocker spread, and conveyor movement finishes.
- **Why It Feels Slow:**
  1. In [`Board.clearCandies()`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1946), each cleared cell has `delay: i * 20`. When a Color Bomb or Combo clears 25 cells, the last cell waits `500ms` before starting its `200ms` pop (`700ms` total just to disappear).
  2. Then `applyGravity()` waits for `Bounce.easeOut` (`150 + rows * 50` ms) **and** `fillEmptySpaces()` runs *sequentially after* `applyGravity()` finishes (`await this.applyGravity(); await this.fillEmptySpaces();`) instead of existing candies and new top-spawned candies falling **simultaneously**!
  3. Watch *Royal Match* or *Candy Crush*: when a match clears, existing tiles and newly spawned tiles above the board fall **together in a single gravity pass**, cutting cascade duration in half!
  4. Furthermore, if a player swipes 100ms before the last tile finishes its landing bounce, the swipe is completely ignored (`if (this.inputLocked) return;`). Adding a **single-move input buffer** (storing a pending swipe made during the final 250ms of a cascade and executing it as soon as `inputLocked` clears) will make the game feel 10× snappier.

### 4.2 Audio Escalation During Cascades
- **Current Behavior ([`GameScene.js:162`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/GameScene.js#L162)):**
  - Cascade 1 plays `'match'` (`523.25Hz -> 1046.50Hz`).
  - Cascade 2, 3, 4, 5+ all play the exact same `'cascade'` sound (`1046.50Hz -> 2093.00Hz`).
- **Industry Benchmark:** The #1 dopamine trigger in Match-3 games is **ascending musical scale pitch per cascade step** (e.g., C5 → D5 → E5 → F5 → G5 → A5 → B5 → C6, or semitone multiplier $2^{(n-1)/12}$). Since [`SoundManager`](file:///c:/Users/thraa/github/sugar-splat/src/systems/SoundManager.js) already uses WebAudio oscillators, passing `cascadeLevel` into `soundManager.play('match', cascadeLevel)` to shift frequency by a major scale degree is a 10-line change with massive payoff.

### 4.3 Visual Feedback & Micro-Interactions
- **Floating Score Popups:** Currently, only the bottom-right HUD score counter animates when points are scored. Spawning a small floating `+30`, `+120` text at the center of each cleared match (colored by the matched candy's hue) connects the action on the board to the score.
- **Conveyor & Portal Animations:** Conveyors pulse their alpha (`0.8 <-> 0.9`) rather than scrolling their stripes, and when conveyors move candies at the end of a turn ([`GameScene.js:364`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/GameScene.js#L364)), any new 3-matches formed by the conveyor movement are **never checked or resolved** until the player makes their next move!

---

## Level 5: Technical Implementation & Phaser 3 Architecture (Applying `phaser` Skill)

### 5.1 The `Board.js` God Object (2,254 Lines)
While [`GameScene.js`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/GameScene.js) was cleanly refactored into managers, [`Board.js`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js) absorbed all 12 blocker implementations and currently manages **22 separate 2D arrays**:
- `grid[][]`, `candies[][]`
- `jelly[][]`, `jellySprites[][]`
- `locked[][]`, `lockSprites[][]`
- `ice[][]`, `iceSprites[][]`
- `chains[][]`, `chainSprites[][]`
- `stone[][]`, `stoneSprites[][]`
- `honey[][]`, `honeySprites[][]`
- `licorice[][]`, `licoriceSprites[][]`
- `chocolate[][]`, `chocolateSprites[][]`
- `crate[][]`, `crateSprites[][]`
- `bombTimer[][]`, `bombTimerSprites[][]`, `bombTimerTexts[][]`
- `conveyor[][]`, `conveyorSprites[][]`
- `portalSprites[][]`

**Architectural Recommendation:**
1. **Extract `BlockerManager.js` (or a unified `CellState` model):** Each cell `(r, c)` can hold a structured cell state `{ floor: 'jelly'|'conveyor'|'portal', obstacle: 'stone'|'chocolate', overlay: { type: 'ice'|'chains'|'crate'|'honey'|'lock', layers: 1 } }`, while `bombTimer` lives on the `Candy` instance itself (`candy.bombTimer = 15`) so it naturally falls with gravity and swaps with the candy!
2. **Extract `InputController.js`:** Move click/tap, double-tap, swipe gesture math, and input buffering out of `Board.js`.
3. **Extract `BoardEffects.js`:** Move `showSpecialActivation`, `showColorBombLasers`, `showCrossEffect`, `showBigExplosion` out of `Board.js`.

### 5.2 Phaser 3 Performance Pitfalls Found (Against `.claude/skills/phaser/knowledgebase/`)
1. **No Object Pooling for Candies ([`08-object-pooling-memory.md`](file:///c:/Users/thraa/github/sugar-splat/.claude/skills/phaser/knowledgebase/08-object-pooling-memory.md)):**
   - Every match destroys `Candy` instances (`candy.destroy()`) and `fillEmptySpaces()` instantiates `new Candy(...)` with new event listeners (`candy.on('pointerdown', ...)`).
   - Over a 40-move level with cascades, hundreds of `Candy` sprites and `selectionIndicator` images are allocated and garbage-collected. Pooling ~64–80 `Candy` sprites in a reusable pool eliminates GC pauses on mobile browsers.
2. **Per-Cell `Phaser.GameObjects.Graphics` Proliferation ([`16-performance-optimization.md`](file:///c:/Users/thraa/github/sugar-splat/.claude/skills/phaser/knowledgebase/16-performance-optimization.md)):**
   - Every single blocker tile (Jelly, Lock, Ice, Chain, Stone, Honey, Licorice, Chocolate, Crate, BombTimer, Conveyor, Portal) creates its own `Phaser.GameObjects.Graphics` object on the board, and many run infinite tweens on those `Graphics` objects!
   - Even when a blocker is hit (e.g., 2-layer Ice → 1-layer Ice, or Bomb Timer decrementing every turn), `createBombTimerSprite()` / `createIceSprite()` **destroys and recreates the `Graphics` and `Text` objects on every single turn** (`Board.js:1097-1150`, `1488`)!
   - **Fix:** Bake blocker textures once in [`BootScene.js`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/BootScene.js) using `graphics.generateTexture('ice_1', ...)` (just like candies!) and use lightweight `Phaser.GameObjects.Image` sprites on the board. For Bomb Timers, just call `this.bombTimerTexts[r][c].setText(moves)` instead of destroying and recreating the `Graphics` and `Text` every move!
3. **Redrawing `progressBar` Graphics Every Tween Frame ([`HUDManager.js:357-374`](file:///c:/Users/thraa/github/sugar-splat/src/ui/HUDManager.js#L357-L374)):**
   - `HUDManager.updateProgressBar()` runs a 300ms tween that calls `this.progressBar.clear(); this.progressBar.fillRoundedRect(...)` on every single frame (60fps). Using a pre-generated rounded bar texture with `setCrop()` or `scaleX` avoids per-frame WebGL geometry triangulation.
4. **Menu & LevelSelect Infinite Timer & Listener Accumulation:**
   - In [`LevelSelectScene.createLevelGrid()`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/LevelSelectScene.js#L345-L349):
     ```js
     this.input.off('pointerdown');
     this.input.off('pointermove');
     this.input.off('pointerup');
     ```
     Calling `this.input.off('pointermove')` with no callback argument removes **all** scene-level `pointermove` listeners—which kills the cursor candy trail created in `createDecorations()` whenever the user switches pages!

---

## Level 6: Comprehensive Bug Catalog (14 Confirmed Bugs)

Here is the prioritized list of concrete bugs discovered in the codebase, with exact file and line references:

### Critical Severity (Breaks Core Progression or Makes Mechanics Non-Functional)

1. **[BUG-01] Bonus Round Consumes `movesRemaining` Before Star Rating Calculation**
   - **Location:** [`GameScene.js:441-459`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/GameScene.js#L441-L459) & [`BonusRoundManager.js:56-98,195`](file:///c:/Users/thraa/github/sugar-splat/src/systems/BonusRoundManager.js#L56-L98)
   - **Cause:** `this.movesRemaining = await this.bonusRoundManager.play(this.movesRemaining, ...)` overwrites `this.movesRemaining` with `currentMoves` (which subtracts up to 10 converted moves). Immediately afterward, `showWinScreen()` checks `if (this.movesRemaining > 5) stars = 2; if (this.movesRemaining > 10) stars = 3;`.
   - **Impact:** Finishing a level with 10 moves left yields **1 star** instead of 3 stars. Players need 16+ moves left for 2 stars and 21+ moves left for 3 stars.
   - **Fix:** Capture `const movesLeftAtWin = this.movesRemaining;` *before* calling `this.bonusRoundManager.play(...)` and compute `stars` from `movesLeftAtWin`.

2. **[BUG-02] Per-Level `candyTypes` (4 or 5 Colors) Is Completely Ignored**
   - **Location:** [`GameScene.js:577`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/GameScene.js#L577)
   - **Cause:** `createBoard()` passes `candyTypes: 6` instead of `candyTypes: this.levelConfig.candyTypes || 6`.
   - **Impact:** All 40 levels spawn all 6 candy colors, breaking the intended 4-color tutorial levels (Levels 1–3, 6–7, 11) and 5-color standard levels (Levels 4–5, 8–10, 12–40).

3. **[BUG-03] Portals (Levels 39–40) Are Visual-Only Dead Code**
   - **Location:** [`Board.js:1617-1625`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1617-L1625) & [`ParticleManager.js:325`](file:///c:/Users/thraa/github/sugar-splat/src/systems/ParticleManager.js#L325)
   - **Cause:** `getPortalExit(row, col)` and `emitPortal()` are defined but never called in `applyGravity()`, `processConveyors()`, or anywhere else.
   - **Impact:** Levels 39 and 40 display portal tutorials and portal sprites, but candies never teleport.

4. **[BUG-04] Contiguous Conveyor Belts Corrupt the Grid & Desync Candy Coordinates**
   - **Location:** [`Board.js:1523-1615`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1523-L1615)
   - **Cause:** `processConveyors()` caches `candy: this.candies[r][c]` for each conveyor cell, then executes sequential pairwise swaps (`for (const move of moves)`), overwriting cells that subsequent moves in the loop expect to still hold their original candy. Furthermore, `processConveyors()` never calls `processCascades()` afterward to resolve matches created by conveyor movement.
   - **Impact:** In Levels 37, 38, and 40, candies on conveyors teleport to wrong coordinates, overwrite each other in `this.candies[][]`, leave ghost sprites on the board, and fail to trigger matches when moved into 3-in-a-row alignments.

5. **[BUG-05] Gravity Drops Candies Out of Ice, Chains, Crates, Locks, Honey & Bomb Timers**
   - **Location:** [`Board.js:1730-1774`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1730-L1774)
   - **Cause:** `applyGravity()` only checks `if (this.stone[r][c] || this.chocolate[r][c])`. Any candy inside `ice`, `chains`, `crate`, `locked`, `honey`, or `bombTimer` falls down into empty cells below it while the blocker/timer array and sprite stay at the old `(r, c)`.
   - **Impact:**
     - Locked candies fall to a new row while remaining non-interactive (`disableInteractive()`), while the new candy falling into the lock cage IS interactive!
     - Bomb timers stay pinned to `(r, c)` instead of falling with their candy.
     - Candies fall right out of their Ice, Chains, and Crates.

6. **[BUG-06] `fillEmptySpaces()` Spawns Candies Inside Chocolate & Tunnels Through Stone**
   - **Location:** [`Board.js:1786-1837`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1786-L1837) & [`Board.js:1659-1672`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1659-L1672)
   - **Cause:**
     1. Neither `fillBoard()` nor `fillEmptySpaces()` checks `if (this.chocolate[r][c]) continue;`. When Chocolate starts on the board or spreads (setting `this.grid[target.row][target.col] = -1` at line 1430), `fillEmptySpaces()` spawns a new candy right on top of the chocolate cell!
     2. When cells *below* a `stone` or `chocolate` are cleared, `applyGravity()` stops candies at the stone/chocolate (`emptyRow = r - 1`), leaving `this.grid[r][c] === -1` below the stone. Then `fillEmptySpaces()` loops over all rows `0..7` and spawns new candies from the top of the screen straight through the stone into the empty cell below!

### High Severity (Data Loss, Gameplay Exploits, Broken UI)

7. **[BUG-07] Powerup Inventory Always Shows `×0` on Level Select Screen**
   - **Location:** [`LevelSelectScene.js:711-718`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/LevelSelectScene.js#L711-L718) vs. [`PowerupManager.js:16-40`](file:///c:/Users/thraa/github/sugar-splat/src/systems/PowerupManager.js#L16-L40)
   - **Cause:** `LevelSelectScene.getPowerups()` reads `localStorage.getItem('sugarSplash_powerups')`, whereas `PowerupManager` saves to `localStorage.getItem('sugarSplash_save')` under `.powerups`.

8. **[BUG-08] Color Bombs Retain Their Old `candyType` in `this.grid[][]` and Match as Normal Candies**
   - **Location:** [`Candy.js:112-130`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Candy.js#L112-L130), [`Board.js:507-530`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L507-L530), [`MatchLogic.js:14-22`](file:///c:/Users/thraa/github/sugar-splat/src/systems/MatchLogic.js#L14-L22)
   - **Cause:** When a 5-match creates a `color_bomb`, `candy.makeSpecial('color_bomb')` changes its texture, but `candy.candyType` and `this.grid[row][col]` remain `0..5`.
   - **Impact:**
     1. A Color Bomb can be matched as part of a normal 3-match of its original color during cascades!
     2. In `Board.trySwap()`, `findMatches()` runs *before* `else if (oneSpecial)`. If swapping a Color Bomb with an adjacent candy happens to complete a 3-match of the Color Bomb's hidden `candyType`, it executes a normal 3-match instead of activating the Color Bomb on the target candy's color!

9. **[BUG-09] Drop Ingredients (`type >= 100`) Do Not Spawn at Level Start, Can Spawn Above Stones, and Can Be Destroyed Mid-Air by Specials**
   - **Location:** [`Board.js:1659-1672`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1659-L1672), [`Board.js:1806-1808`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1806-L1808), [`Board.js:1936-1953`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1936-L1953), [`GameScene.js:395-400`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/GameScene.js#L395-L400)
   - **Cause:**
     1. `fillBoard()` never spawns initial ingredients on `drop` levels.
     2. `fillEmptySpaces()` spawns ingredients in any column with a 10% chance, including columns blocked by stones (e.g., `(7,7)` in Level 40).
     3. `clearCandies()` destroys ingredients hit by specials/powerups at any row, and `GameScene` counts `candyCleared` with `type >= 100` as a successful drop!
     4. If `shuffle()` runs while an ingredient is on the board (`Board.js:2188-2210`), `shuffle()` includes the ingredient in `all` (`type = 100`), shuffles its position to a random cell, and calls `candy.setTexture('candy_100')` (which **does not exist**—the texture is `'ingredient_0'`!), turning the cherry into a missing-texture green box while the old `Candy` object still has `this.isIngredient = true` on a normal candy!

### Medium Severity (Audio, Input, Memory & Visual Bugs)

10. **[BUG-10] Muting "Sound" (SFX) Also Mutes In-Game Music, While Menu Music Ignores `sound.mute`**
    - **Location:** [`SoundManager.js:251`](file:///c:/Users/thraa/github/sugar-splat/src/systems/SoundManager.js#L251) & [`C64Sequencer.js:61-90`](file:///c:/Users/thraa/github/sugar-splat/src/systems/C64Sequencer.js#L61-L90)
    - **Cause:** `SoundManager.playStep()` checks `if (!this.scene || this.scene.sound.mute) return;`. Since toggling `☐ Sound` sets `this.scene.sound.mute = true`, turning off SFX while leaving `☑ Music` enabled still silences in-game music! Meanwhile, `C64Sequencer` only checks `sugarSplash_music`, so behavior is inconsistent between Menu and Game.

11. **[BUG-11] LevelSelect Drag-Scrolling Triggers Accidental Level Launches**
    - **Location:** [`LevelSelectScene.js:360-375,524`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/LevelSelectScene.js#L360-L375)
    - **Cause:** `hitArea.on('pointerup', () => this.scene.start('GameScene', { level }))` fires on `pointerup` regardless of how far the user dragged `this.levelContainer` during `pointermove`.

12. **[BUG-12] Incomplete Event & DisplayObject Cleanup on Scene Shutdown / Restart**
    - **Location:** [`GameScene.js:625-648`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/GameScene.js#L625-L648), [`Board.js:2243-2253`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L2243-L2253), [`ParticleManager.js:453-458`](file:///c:/Users/thraa/github/sugar-splat/src/systems/ParticleManager.js#L453-L458)
    - **Cause:**
      - `GameScene.shutdown()` does not remove listeners for `chocolateCleared`, `chocolateSpread`, `crateBroken`, `crateHit`, `bombTimerCleared`, `bombTimerExpired`, or `conveyorMoved`.
      - `Board.destroy()` only destroys `candies`, `jellySprites`, and `lockSprites`, leaking 10 other blocker sprite/text arrays.
      - `ParticleManager.destroy()` does not destroy its 10 particle emitters.

13. **[BUG-13] Special Candy Creation Inside Existing Special Stacks Infinite Tweens & Drops Activation**
    - **Location:** [`Candy.js:143-150`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Candy.js#L143-L150) & [`Board.js:1881-1909`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1881-L1909)
    - **Cause:** If a candy at `specialPosition` is already special, `clearCandiesWithSpecials` filters it out of `toClear` and calls `old.makeSpecial(special.type)` without detonating its previous special effect or stopping its existing `this.specialPulse` tween.

14. **[BUG-14] Color Palette Mismatch Between `Config.js` and `Board.getCandyColor()`**
    - **Location:** [`Config.js:40-47`](file:///c:/Users/thraa/github/sugar-splat/src/Config.js#L40-L47) vs. [`Board.js:2126-2136`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L2126-L2136)
    - **Cause:** `Board.getCandyColor()` hardcodes its own color array where index 5 is `0xffeb3b` (Yellow) instead of reading `GameConfig.COLORS[candyType]` (`0xff7f50` Coral/Orange).

---

## Level 7: Strategic Recommendations & Roadmap

### Phase 1: Critical Bug Fixes (Immediate High-Impact Wins)
1. **Fix Star Rating Calculation ([`GameScene.js`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/GameScene.js#L441-L459)):** Save `const movesBeforeBonus = this.movesRemaining;` before `bonusRoundManager.play()` and calculate 1/2/3 stars from `movesBeforeBonus`.
2. **Pass Level `candyTypes` to Board ([`GameScene.js`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/GameScene.js#L577)):** Change `candyTypes: 6` to `candyTypes: this.levelConfig.candyTypes || 6`.
3. **Unify Powerup Storage Key ([`LevelSelectScene.js`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/LevelSelectScene.js#L711-L718)):** Read `JSON.parse(localStorage.getItem('sugarSplash_save'))?.powerups || {}`.
4. **Fix `shuffle()` Ingredient Corruption ([`Board.js`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L2188-L2210)):** Exclude `candy.isIngredient` (and ` !this.canSwapAt(r, c)`) from `shuffle()`, and protect ingredients from being destroyed by specials/powerups in `clearCandies()`.
5. **Fix Color Bomb Grid Type ([`Board.js`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js), [`Candy.js`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Candy.js)):** Set a dedicated non-matching grid value (e.g., `grid[r][c] = 99`) when a candy becomes a `color_bomb`, and check `oneSpecial` with `color_bomb` *before* normal `findMatches()` in `trySwap()`.
6. **Fix Audio Mute Separation ([`SoundManager.js`](file:///c:/Users/thraa/github/sugar-splat/src/systems/SoundManager.js#L251), [`C64Sequencer.js`](file:///c:/Users/thraa/github/sugar-splat/src/systems/C64Sequencer.js)):** Check `localStorage.getItem('sugarSplash_music') === 'false'` for music steps and `this.scene.sound.mute` strictly for SFX.

### Phase 2: Board Physics, Blockers & World 7–8 Mechanics Overhaul
1. **Define Clear Gravity Rules for All Blockers:**
   - **Cell-Anchored Blockers (`stone`, `chocolate`, `ice`, `chains`, `crate`, `locked`):** Act as immovable obstacles during `applyGravity()` (or allow diagonal slide-around below stones/crates so cells underneath don't stay permanently empty or tunnel through stones!).
   - **Candy-Attached Modifiers (`bombTimer`):** Attach `bombTimer` directly to the `Candy` instance so the countdown bomb falls with gravity and moves on conveyors.
   - **Background/Floor Modifiers (`jelly`, `honey`, `conveyor`, `portals`):** Stay on the cell `(r, c)`.
2. **Implement Portal Teleportation in Gravity ([`Board.js`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js)):**
   - During `applyGravity()`, when a candy lands on or passes through a portal `entrance` and the `exit` cell (or column below `exit`) has space, teleport the candy to `exit`, emit `particleManager.emitPortal()`, and continue gravity resolution.
3. **Fix Conveyor Simultaneous Movement:**
   - Snapshot `(r, c) -> { gridType, candy }` across all conveyor cells first, then write all target cells in a second pass, and run `processBoardState()` afterward so conveyor-created matches cascade naturally!
4. **Differentiate Crate vs. Ice vs. Chains:**
   - Make **Crates** (`crate`) a candy-less multi-layer wooden box cleared by **adjacent matches** (like non-spreading Chocolate with 1–3 HP), giving World 7 a distinct tactical puzzle mechanic.

### Phase 3: "Juice", Visual Polish & Performance
1. **Simultaneous Gravity + Refill & Input Buffering:**
   - Combine `applyGravity()` and `fillEmptySpaces()` into a single coordinated tween pass so top-spawned candies fall right on the heels of existing candies.
   - Buffer a user's swipe if performed during the final 250ms of a cascade.
2. **Ascending Pitch Scale on Cascades:**
   - Shift match SFX pitch up a C-major scale (`[1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2]`) with `cascadeLevel`, accompanied by floating `+Score` text at the match centroid.
3. **Preserve Candy Shapes on Special Tiles:**
   - In [`BootScene.createSpecialTextures()`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/BootScene.js#L299-L349), draw the candy's actual shape (Circle, Square, Diamond, Star, Triangle, Hexagon) as the base of `line_h`, `line_v`, and `bomb` textures so colorblind accessibility is preserved across all tile states.
4. **Custom WebFont & World-Based Level Select:**
   - Load a playful rounded display font (e.g., *Fredoka* or *Baloo 2* via Google Fonts in `index.html`) and organize `LevelSelectScene` into **8 themed World pages (5 levels per world)** or **2 pages of 20 levels** with World headers.

---

## Level 8: Implementation Status, Playability Audit & Anti-Block Mitigations (Completed)

All **14 critical/high/medium/minor bugs (`[BUG-01]`–`[BUG-14]`)**, all **8 design picklist resolutions (`A1`–`A8`)**, and **10 deep playability & anti-block mitigations** have been implemented and verified via automated Playwright browser testing across all 40 levels:

1. **Guaranteed Non-Blocking Mid-Turn & End-of-Turn `Board.shuffle()` ([`Board.js:2686-2860`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L2686-L2860)):**
   - Removed the early-return `if (this.inputLocked) return;` guard that previously skipped mid-turn shuffles when called from [`ActionProcessor.processBoardState()`](file:///c:/Users/thraa/github/sugar-splat/src/systems/ActionProcessor.js#L105-L109), and preserved `wasLocked` state so input is never unlocked prematurely mid-turn.
   - Added a 3-tier anti-block guarantee:
     1. Up to 25 random permutations of movable candies (`hasValidMoves() && findMatches().length === 0`).
     2. Deterministic L/line 3-match pattern construction across swappable neighbor pairs (respecting Licorice walls and blockers).
     3. **Emergency Anti-Block Mitigation:** If blockers (`honey`, `chocolate`, `ice`, `chains`, `crate`, `locked`) have isolated the entire board so `< 3` movable candies exist or no 3-match geometry is possible, automatically frees up to 3 blocker cells and/or converts a movable candy into a `line_h` special so a level can **never** soft-lock.
2. **Perched Drop Ingredient (`🍒`) Diagonal Slide-Off ([`Board.js:2112-2175`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L2112-L2175)):**
   - When a Drop Ingredient (`🍒`) is resting directly on top of a `stone`, `chocolate`, or pinned blocker (`isGravityObstacle(r + 1, col)`), clearing a cell in an adjacent column (`c - 1` or `c + 1`) prioritizes sliding that perched ingredient diagonally off the obstacle into `(r + 1, c ± 1)` before vertical falls in column `c ± 1`.
   - Initial cherry spawning in [`Board.fillBoard()`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1960-L1988) prefers columns with no Stones or Portal Exits.
3. **Conveyor Belt vs. Drop Ingredient Loop Protection ([`Board.js:1730-1805`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1730-L1805)):**
   - Conveyors never push Drop Ingredients upward (`dir === 'up'`) and never displace an off-belt Drop Ingredient backward to the conveyor's tail (preventing infinite conveyor loops on Level 37).
   - Added iterative pruning so conveyor cells behind a blocked conveyor cell stop cleanly instead of overwriting or jumping across blockers.
4. **Spreading Hazard (`Honey` & `Chocolate`) Immunity ([`Board.js:1513-1605`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1513-L1605)):**
   - Prevented `spreadHoney()` and `spreadChocolate()` from spreading onto Drop Ingredients (`🍒`), Special Candies, Crates, Locks, Bomb Timers, Portal entrances/exits, or bottom-row collection cells on `drop` levels.
5. **Awaited Turn-End Lifecycle & Win-Priority Check ([`GameScene.js:347-417`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/GameScene.js#L347-L417), [`Board.js:538-618`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L538-L618)):**
   - Replaced un-awaited `emit('cascadeComplete')` calls with `await this.completeTurn()` (`await this.scene.onTurnEnd()`) so input stays locked throughout conveyor movement and turn-end hazard resolution.
   - Checked `checkWinCondition()` **before** `spreadHoney()`, `spreadChocolate()`, and `decrementBombTimers()` so completing an objective on the final move or with a Bomb Timer at `1` always awards the win.
   - Added a post-hazard `if (!this.board.hasValidMoves()) await this.board.shuffle();` check at the end of `onTurnEnd()`.
6. **Parallel Special Mutual-Recursion Guard ([`ActionProcessor.js:180-224`](file:///c:/Users/thraa/github/sugar-splat/src/systems/ActionProcessor.js#L180-L224)):**
   - Tracked `triggeredSet` and `candy._activating` in `activateSpecial()` so two `line_h` / `line_v` / `bomb` specials on the same row/col triggered in parallel never re-trigger each other in a loop.
7. **Powerup Targeting on Chocolate & Locked Cells ([`Board.js:169-181`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L169-L181), [`PowerupManager.js:216-306`](file:///c:/Users/thraa/github/sugar-splat/src/systems/PowerupManager.js#L216-L306)):**
   - Kept locked candies interactive so tapping them plays `showBlockedFeedback()` or activates a selected Powerup (`Hammer`, `Bomb`, `Row/Col`), and enabled board-level Powerup clicks on empty-candy `Chocolate` cells.
8. **Hint System Support for Special Swaps & Taps ([`MatchLogic.js:231-310`](file:///c:/Users/thraa/github/sugar-splat/src/systems/MatchLogic.js#L231-L310), [`HintManager.js:79-175`](file:///c:/Users/thraa/github/sugar-splat/src/systems/HintManager.js#L79-L175)):**
   - Included Special+Special combos, Special+Normal swaps, and single-cell Special double-taps in `MatchLogic.findValidMove()` and `HintManager.showHint()`.
9. **Tiny & Micro-Polish Resolutions (`[TINY-01]`–`[TINY-05]`):**
   - **`[TINY-01]` Non-Overwriting Special Creation ([`MatchLogic.js:140-206`](file:///c:/Users/thraa/github/sugar-splat/src/systems/MatchLogic.js#L140-L206)):** `createMatchObject()` and `createIntersectionMatch()` now prefer a non-special cell (`!isExistingSpecial(c)`) for `specialPosition` so existing specials in a 4/5/T/L match detonate via `ActionProcessor` rather than being overwritten in place.
   - **`[TINY-02]` 100% Unified `Fredoka` Typography ([`MenuScene.js`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/MenuScene.js), [`LevelSelectScene.js`](file:///c:/Users/thraa/github/sugar-splat/src/scenes/LevelSelectScene.js), [`DialogManager.js`](file:///c:/Users/thraa/github/sugar-splat/src/systems/DialogManager.js), [`PowerupManager.js`](file:///c:/Users/thraa/github/sugar-splat/src/systems/PowerupManager.js), [`Board.js`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js)):** Replaced all remaining hardcoded `'Arial'` and `'Arial Black'` strings with `GameConfig.UI.FONT_FAMILY` and `GameConfig.UI.FONT_FAMILY_BODY`.
   - **`[TINY-03]` Zero Magic Numbers Across Board & HUD ([`Board.js`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js), [`HUDManager.js`](file:///c:/Users/thraa/github/sugar-splat/src/ui/HUDManager.js)):** Routed all Jelly/Lock colors, gravity/fill/clear/shuffle/explosion durations, background gradients, and progress bar colors through `GameConfig`.
   - **`[TINY-04]` High-Contrast Warm Candy Palette & Collect Icons ([`Config.js:39-47`](file:///c:/Users/thraa/github/sugar-splat/src/Config.js#L39-L47), [`HUDManager.js:140-145`](file:///c:/Users/thraa/github/sugar-splat/src/ui/HUDManager.js#L140-L145)):** Separated `COLORS[3]` (`0xffd32a` Sunny Golden Yellow Star) from `COLORS[5]` (`0xff6348` Vivid Coral-Orange Hexagon) and updated HUD collect icons to `['🔴', '🔵', '🟢', '⭐', '🟣', '🟠']`.
   - **`[TINY-05]` Animated Conveyor Stripes, Dramatic Multi-Ring Explosions & Hint Hand Pointer ([`Board.js:1326-1382`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L1326-L1382), [`Board.js:2530-2815`](file:///c:/Users/thraa/github/sugar-splat/src/objects/Board.js#L2530-L2815), [`HintManager.js:145-163`](file:///c:/Users/thraa/github/sugar-splat/src/systems/HintManager.js#L145-L163), [`HintManager.js:321-345`](file:///c:/Users/thraa/github/sugar-splat/src/systems/HintManager.js#L321-L345)):** Added continuous directional stripe animation on conveyor belts, multi-ring shockwaves + colored beam halos + core flashes on special activations, and an animated pointing hand (`👆`) on hints.
