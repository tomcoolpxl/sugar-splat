import Candy from './Candy.js';
import MatchLogic from '../systems/MatchLogic.js';
import ActionProcessor from '../systems/ActionProcessor.js';
import { GameConfig } from '../Config.js';

export default class Board {
    constructor(scene, config) {
        this.scene = scene;
        this.rows = config.rows || 8;
        this.cols = config.cols || 8;
        this.x = config.x;
        this.y = config.y;
        this.cellSize = config.cellSize;
        this.candyTypes = config.candyTypes || 6;

        // Grid data (candy type per cell, -1 = empty)
        this.grid = [];

        // Sprite references
        this.candies = [];

        // Blocker data
        this.jelly = [];
        this.jellySprites = [];
        this.locked = [];
        this.lockSprites = [];

        // Level config for blockers
        this.levelConfig = config.levelConfig || null;

        // Selection state
        this.selectedCandy = null;
        this.lastClickTime = 0;
        this.lastClickCandy = null;

        // Lock input during animations
        this.inputLocked = false;

        // Initialize Systems
        this.matchLogic = new MatchLogic(this);
        this.actionProcessor = new ActionProcessor(this);

        // Track cells being cleared to avoid double-clearing
        this.clearingCells = new Set();

        // Initialize the board
        this.initialize();
    }

    initialize() {
        // Create empty grid arrays
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            this.candies[row] = [];
            this.jelly[row] = [];
            this.jellySprites[row] = [];
            this.locked[row] = [];
            this.lockSprites[row] = [];

            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = -1;
                this.candies[row][col] = null;
                this.jelly[row][col] = 0;
                this.jellySprites[row][col] = null;
                this.locked[row][col] = false;
                this.lockSprites[row][col] = null;
            }
        }

        if (this.levelConfig) this.applyLevelBlockers();
        this.drawCellBackgrounds();
        this.drawJellyLayer();
        this.fillBoard();
        this.drawLockOverlays();
    }

    applyLevelBlockers() {
        if (this.levelConfig.jelly) {
            for (const cell of this.levelConfig.jelly) {
                if (this.isValidCell(cell.row, cell.col)) this.jelly[cell.row][cell.col] = cell.layers || 1;
            }
        }
        if (this.levelConfig.locked) {
            for (const cell of this.levelConfig.locked) {
                if (this.isValidCell(cell.row, cell.col)) this.locked[cell.row][cell.col] = true;
            }
        }
    }

    // --- Delegation Methods ---

    findMatches() { return this.matchLogic.findMatches(); }
    hasValidMoves() { return this.matchLogic.hasValidMoves(); }
    findValidMove() { return this.matchLogic.findValidMove(); }

    async processBoardState(matches) { return this.actionProcessor.processBoardState(matches); }
    async processMatches(matches) { return this.actionProcessor.processBoardState(matches); }
    async processCascades() { return this.actionProcessor.processBoardState(); }
    async activateSpecial(candy, target) { return this.actionProcessor.activateSpecial(candy, target); }

    // --- Input & Board State Management ---

    onCandyClick(candy) {
        if (this.inputLocked) return;
        if (this.locked[candy.row][candy.col]) {
            this.showLockedFeedback(candy);
            return;
        }

        const now = Date.now();
        if (this.lastClickCandy === candy && now - this.lastClickTime < 300) {
            if (candy.isSpecial) {
                this.activateTap(candy);
                this.lastClickCandy = null;
                this.lastClickTime = 0;
                return;
            }
        }
        this.lastClickCandy = candy;
        this.lastClickTime = now;

        if (this.selectedCandy === null) {
            this.selectCandy(candy);
        } else if (this.selectedCandy === candy) {
            this.deselectCandy();
        } else if (this.isAdjacent(this.selectedCandy.row, this.selectedCandy.col, candy.row, candy.col)) {
            if (this.locked[candy.row][candy.col]) {
                this.showLockedFeedback(candy);
                this.deselectCandy();
                return;
            }
            this.trySwap(this.selectedCandy, candy);
        } else {
            this.deselectCandy();
            this.selectCandy(candy);
        }
    }

    async activateTap(candy) {
        this.inputLocked = true;
        this.deselectCandy();
        try {
            this.scene.events.emit('validSwap');
            await this.activateSpecial(candy);
            await this.applyGravity();
            await this.fillEmptySpaces();
            await this.processCascades();
            this.scene.events.emit('cascadeComplete');
        } finally {
            this.inputLocked = false;
        }
    }

    async trySwap(candy1, candy2) {
        this.inputLocked = true;
        this.deselectCandy();
        try {
            const bothSpecial = candy1.isSpecial && candy2.isSpecial;
            const oneSpecial = candy1.isSpecial || candy2.isSpecial;

            await this.swapCandies(candy1, candy2);

            if (bothSpecial) {
                this.scene.events.emit('validSwap');
                await this.activateSpecialCombo(candy1, candy2);
                await this.applyGravity();
                await this.fillEmptySpaces();
                await this.processCascades();
                this.scene.events.emit('cascadeComplete');
                return;
            }

            const matches = this.findMatches();
            if (matches.length > 0) {
                this.scene.events.emit('validSwap');
                await this.processMatches(matches);
                this.scene.events.emit('cascadeComplete');
            } else if (oneSpecial) {
                const specialCandy = candy1.isSpecial ? candy1 : candy2;
                this.scene.events.emit('validSwap');
                await this.activateSpecial(specialCandy, candy1 === specialCandy ? candy2 : candy1);
                await this.applyGravity();
                await this.fillEmptySpaces();
                await this.processCascades();
                this.scene.events.emit('cascadeComplete');
            } else {
                await this.swapCandies(candy1, candy2);
                this.scene.events.emit('invalidSwap');
            }
        } finally {
            this.inputLocked = false;
        }
    }

    // --- Animation & Grid Logic ---

    swapCandies(candy1, candy2) {
        return new Promise((resolve) => {
            const tempType = this.grid[candy1.row][candy1.col];
            this.grid[candy1.row][candy1.col] = this.grid[candy2.row][candy2.col];
            this.grid[candy2.row][candy2.col] = tempType;

            this.candies[candy1.row][candy1.col] = candy2;
            this.candies[candy2.row][candy2.col] = candy1;

            const tempRow = candy1.row;
            const tempCol = candy1.col;
            candy1.row = candy2.row;
            candy1.col = candy2.col;
            candy2.row = tempRow;
            candy2.col = tempCol;

            const pos1 = this.gridToWorld(candy1.row, candy1.col);
            const pos2 = this.gridToWorld(candy2.row, candy2.col);

            this.scene.tweens.add({ targets: candy1, x: pos1.x, y: pos1.y, duration: GameConfig?.BOARD?.ANIMATION_SPEED?.SWAP || 150, ease: 'Power2' });
            this.scene.tweens.add({ targets: candy2, x: pos2.x, y: pos2.y, duration: GameConfig?.BOARD?.ANIMATION_SPEED?.SWAP || 150, ease: 'Power2', onComplete: resolve });
        });
    }

    async activateSpecialCombo(candy1, candy2) {
        const type1 = candy1.specialType;
        const type2 = candy2.specialType;
        let cells = [];

        if (type1 === 'color_bomb' && type2 === 'color_bomb') {
            for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.candies[r][c]) cells.push({ row: r, col: c });
            await this.showBigExplosion(candy1.row, candy1.col);
        } else if (type1 === 'color_bomb' || type2 === 'color_bomb') {
            const colorBomb = type1 === 'color_bomb' ? candy1 : candy2;
            const other = type1 === 'color_bomb' ? candy2 : candy1;
            const targetColor = other.candyType;
            const targetSpecial = other.specialType === 'bomb' ? 'bomb' : (Math.random() > 0.5 ? 'line_h' : 'line_v');

            const targets = [];
            for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.grid[r][c] === targetColor && this.candies[r][c]) targets.push(this.candies[r][c]);

            for (const target of targets) {
                target.makeSpecial(targetSpecial);
                await new Promise(r => this.scene.time.delayedCall(20, r));
            }
            await Promise.all(targets.map(t => this.activateSpecial(t)));
            cells.push({ row: candy1.row, col: candy1.col }, { row: candy2.row, col: candy2.col });
        } else {
            const row = candy1.row;
            const col = candy1.col;
            if (type1.startsWith('line') && type2.startsWith('line')) {
                for (let c = 0; c < this.cols; c++) if (this.candies[row][c]) cells.push({ row, col: c });
                for (let r = 0; r < this.rows; r++) if (this.candies[r][col] && r !== row) cells.push({ row: r, col });
                await this.showCrossEffect(row, col);
            } else if (type1 === 'bomb' && type2 === 'bomb') {
                for (let r = row - 2; r <= row + 2; r++) for (let c = col - 2; c <= col + 2; c++) if (this.isValidCell(r, c) && this.candies[r][c]) cells.push({ row: r, col: c });
                await this.showBigExplosion(row, col);
            } else {
                const line = type1.startsWith('line') ? candy1 : candy2;
                const bomb = type1 === 'bomb' ? candy1 : candy2;
                if (line.specialType === 'line_h') {
                    for (let r = bomb.row - 1; r <= bomb.row + 1; r++) if (r >= 0 && r < this.rows) for (let c = 0; c < this.cols; c++) if (this.candies[r][c]) cells.push({ row: r, col: c });
                } else {
                    for (let c = bomb.col - 1; c <= bomb.col + 1; c++) if (c >= 0 && c < this.cols) for (let r = 0; r < this.rows; r++) if (this.candies[r][col]) cells.push({ row: r, col: c });
                }
                await this.showBigExplosion(bomb.row, bomb.col);
            }
        }

        const adjacentCells = new Set();
        const specialsToActivate = [];
        for (const cell of cells) {
            this.getAdjacentCells(cell.row, cell.col).forEach(adj => adjacentCells.add(`${adj.row},${adj.col}`));
            const target = this.candies[cell.row][cell.col];
            if (target && target.isSpecial && target !== candy1 && target !== candy2) specialsToActivate.push(target);
        }
        await this.unlockAdjacentTiles(adjacentCells);
        this.scene.events.emit('scoreUpdate', this.calculateScore(cells.length, 1) + 100, 1);
        await this.clearCandies(cells);
        for (const s of specialsToActivate) if (s.scene) await this.activateSpecial(s);
    }

    async detonateAllSpecials() {
        const specials = [];
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.candies[r][c] && this.candies[r][c].isSpecial) specials.push(this.candies[r][c]);
        if (specials.length > 0) {
            await Promise.all(specials.map(s => s.scene ? this.activateSpecial(s) : Promise.resolve()));
            await this.applyGravity();
            await this.fillEmptySpaces();
            await this.processCascades();
        }
    }

    // --- Helper Visual Methods ---

    gridToWorld(row, col) { return { x: this.x + col * this.cellSize + this.cellSize / 2, y: this.y + row * this.cellSize + this.cellSize / 2 }; }
    isValidCell(row, col) { return row >= 0 && row < this.rows && col >= 0 && col < this.cols; }
    isAdjacent(r1, c1, r2, c2) { return (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2); }

    drawCellBackgrounds() {
        const graphics = this.scene.add.graphics();
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const { x, y } = this.gridToWorld(r, c);
                graphics.fillStyle(0xffffff, (r + c) % 2 === 0 ? 0.1 : 0.15);
                graphics.fillRoundedRect(x - this.cellSize / 2 + 2, y - this.cellSize / 2 + 2, this.cellSize - 4, this.cellSize - 4, 8);
            }
        }
    }

    drawJellyLayer() {
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.jelly[r][c] > 0) this.createJellySprite(r, c);
    }

    createJellySprite(row, col) {
        const { x, y } = this.gridToWorld(row, col);
        const layers = this.jelly[row][col];
        if (this.jellySprites[row][col]) this.jellySprites[row][col].destroy();
        const graphics = this.scene.add.graphics().setDepth(0.5);
        graphics.fillStyle(layers === 2 ? 0xff1493 : 0xff69b4, layers === 2 ? 0.8 : 0.6);
        graphics.fillRoundedRect(x - this.cellSize / 2 + 2, y - this.cellSize / 2 + 2, this.cellSize - 4, this.cellSize - 4, 12);
        if (layers === 2) {
            graphics.lineStyle(4, 0xffffff, 0.8);
            graphics.strokeRoundedRect(x - this.cellSize / 2 + 2, y - this.cellSize / 2 + 2, this.cellSize - 4, this.cellSize - 4, 12);
        }
        this.jellySprites[row][col] = graphics;
    }

    drawLockOverlays() {
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.locked[r][c]) this.createLockSprite(r, c);
    }

    createLockSprite(row, col) {
        const { x, y } = this.gridToWorld(row, col);
        if (this.lockSprites[row][col]) this.lockSprites[row][col].destroy();
        const graphics = this.scene.add.graphics().setDepth(2);
        const size = this.cellSize - 8;
        const left = x - size / 2, top = y - size / 2;
        graphics.lineStyle(3, 0x87ceeb, 0.9);
        for (let i = 0; i <= 3; i++) {
            graphics.lineBetween(left + (size / 3) * i, top, left + (size / 3) * i, top + size);
            graphics.lineBetween(left, top + (size / 3) * i, left + size, top + (size / 3) * i);
        }
        this.lockSprites[row][col] = graphics;
        if (this.candies[row][col]) this.candies[row][col].disableInteractive();
    }

    removeLockSprite(row, col) {
        if (this.lockSprites[row][col]) {
            const sprite = this.lockSprites[row][col];
            this.scene.tweens.add({ targets: sprite, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: 300, onComplete: () => sprite.destroy() });
            this.lockSprites[row][col] = null;
        }
        if (this.candies[row][col]) this.candies[row][col].setInteractive({ useHandCursor: true });
        this.scene.events.emit('lockBroken', row, col);
    }

    fillBoard() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === -1) {
                    const type = this.getValidCandyType(r, c);
                    this.createCandy(r, c, type);
                    if (this.locked[r][c]) this.candies[r][c].disableInteractive();
                }
            }
        }
    }

    getValidCandyType(row, col) {
        const invalid = new Set();
        if (col >= 2 && this.grid[row][col - 1] === this.grid[row][col - 2]) invalid.add(this.grid[row][col - 1]);
        if (row >= 2 && this.grid[row - 1][col] === this.grid[row - 2][col]) invalid.add(this.grid[row - 1][col]);
        const valid = [];
        for (let i = 0; i < this.candyTypes; i++) if (!invalid.has(i)) valid.push(i);
        return Phaser.Utils.Array.GetRandom(valid.length ? valid : [0]);
    }

    createCandy(row, col, type, animated = false) {
        const { x, y } = this.gridToWorld(row, col);
        const candy = new Candy(this.scene, x, y, type, row, col);
        candy.setDisplaySize(this.cellSize - 12, this.cellSize - 12).setDepth(1);
        candy.on('pointerdown', () => this.onCandyClick(candy));
        this.grid[row][col] = type;
        this.candies[row][col] = candy;
        if (animated) {
            candy.y = this.y - this.cellSize;
            this.scene.tweens.add({ targets: candy, y: y, alpha: 1, duration: 200 + row * 50, ease: 'Bounce.easeOut' });
        }
        return candy;
    }

    // --- Action Methods ---

    async applyGravity() {
        const tweens = [];
        for (let c = 0; c < this.cols; c++) {
            let emptyRow = this.rows - 1;
            for (let r = this.rows - 1; r >= 0; r--) {
                if (this.grid[r][c] !== -1) {
                    if (r !== emptyRow) {
                        const candy = this.candies[r][c];
                        this.grid[emptyRow][c] = this.grid[r][c];
                        this.grid[r][c] = -1;
                        this.candies[emptyRow][c] = candy;
                        this.candies[r][c] = null;
                        candy.row = emptyRow;
                        const target = this.gridToWorld(emptyRow, c);
                        tweens.push({ targets: candy, y: target.y, duration: 100 + (emptyRow - r) * 50, ease: 'Bounce.easeOut' });
                    }
                    emptyRow--;
                }
            }
        }
        if (tweens.length === 0) return;
        await Promise.all(tweens.map(t => new Promise(res => this.scene.tweens.add({ ...t, onComplete: res }))));
    }

    async fillEmptySpaces() {
        const tweens = [];
        for (let c = 0; c < this.cols; c++) {
            let emptyCount = 0;
            for (let r = 0; r < this.rows; r++) if (this.grid[r][c] === -1) emptyCount++;
            for (let r = 0; r < this.rows; r++) {
                if (this.grid[r][c] === -1) {
                    const type = this.getValidCandyType(r, c);
                    const { x, y } = this.gridToWorld(r, c);
                    const candy = new Candy(this.scene, x, this.y - this.cellSize * (emptyCount - r), type, r, c);
                    candy.setDisplaySize(this.cellSize - 12, this.cellSize - 12).setDepth(1).on('pointerdown', () => this.onCandyClick(candy));
                    this.grid[r][c] = type;
                    this.candies[r][c] = candy;
                    tweens.push({ targets: candy, y: y, duration: 200 + r * 50, ease: 'Bounce.easeOut' });
                }
            }
        }
        if (tweens.length === 0) return;
        await Promise.all(tweens.map(t => new Promise(res => this.scene.tweens.add({ ...t, onComplete: res }))));
    }

    async clearCandiesWithSpecials(cells, specialsToCreate) {
        const specialPos = new Set(specialsToCreate.map(s => `${s.position.row},${s.position.col}`));
        const toClear = cells.filter(c => !specialPos.has(`${c.row},${c.col}`));
        
        const promises = toClear.map((cell, i) => {
            const candy = this.candies[cell.row][cell.col];
            if (candy) {
                this.handleJellyAt(cell.row, cell.col);
                this.grid[cell.row][cell.col] = -1;
                this.candies[cell.row][cell.col] = null;
                this.scene.events.emit('candyCleared', cell.row, cell.col, candy.candyType);
                return new Promise(res => this.scene.tweens.add({ targets: candy, scaleX: 0, scaleY: 0, alpha: 0, duration: 200, delay: i * 20, onComplete: () => { candy.destroy(); res(); } }));
            }
            return Promise.resolve();
        });

        const specialPromises = specialsToCreate.map(special => {
            const { row, col } = special.position;
            const old = this.candies[row][col];
            this.handleJellyAt(row, col);
            if (old) {
                return new Promise(res => this.scene.tweens.add({ targets: old, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true, onComplete: () => { old.makeSpecial(special.type); res(); } }));
            } else {
                const candy = this.createCandy(row, col, special.candyType);
                candy.makeSpecial(special.type);
                candy.setScale(0);
                return new Promise(res => this.scene.tweens.add({ targets: candy, scaleX: 1, scaleY: 1, duration: 200, onComplete: res }));
            }
        });

        await Promise.all([...promises, ...specialPromises]);
    }

    async clearCandies(cells) {
        const promises = cells.map((cell, i) => {
            const candy = this.candies[cell.row][cell.col];
            if (candy) {
                this.handleJellyAt(cell.row, cell.col);
                if (this.locked[cell.row][cell.col]) { this.locked[cell.row][cell.col] = false; this.removeLockSprite(cell.row, cell.col); }
                this.grid[cell.row][cell.col] = -1;
                this.candies[cell.row][cell.col] = null;
                this.scene.events.emit('candyCleared', cell.row, cell.col, candy.candyType);
                return new Promise(res => this.scene.tweens.add({ targets: candy, scaleX: 0, scaleY: 0, alpha: 0, duration: 200, delay: i * 20, onComplete: () => { candy.destroy(); res(); } }));
            }
            return Promise.resolve();
        });
        await Promise.all(promises);
    }

    handleJellyAt(row, col) {
        if (this.jelly[row][col] > 0) {
            this.jelly[row][col]--;
            if (this.jelly[row][col] === 0) {
                if (this.jellySprites[row][col]) {
                    const sprite = this.jellySprites[row][col];
                    this.scene.tweens.add({ targets: sprite, alpha: 0, scaleX: 1.2, scaleY: 1.2, duration: 200, onComplete: () => sprite.destroy() });
                }
                this.scene.events.emit('jellyCleared', row, col);
            } else {
                this.createJellySprite(row, col);
                this.scene.events.emit('jellyHit', row, col);
            }
        }
    }

    calculateScore(tiles, cascade) { return Math.floor(10 * tiles * Math.pow(1.5, cascade - 1)); }

    async showSpecialActivation(candy) {
        const { x, y } = this.gridToWorld(candy.row, candy.col);
        const graphics = this.scene.add.graphics();
        if (candy.specialType === 'line_h') {
            graphics.fillStyle(0xffffff, 0.8).fillRect(this.x, y - 10, this.cols * this.cellSize, 20);
        } else if (candy.specialType === 'line_v') {
            graphics.fillStyle(0xffffff, 0.8).fillRect(x - 10, this.y, 20, this.rows * this.cellSize);
        } else if (candy.specialType === 'bomb') {
            graphics.fillStyle(0xffff00, 0.6).fillCircle(x, y, this.cellSize * 1.5);
        } else if (candy.specialType === 'color_bomb') {
            graphics.lineStyle(4, 0xffffff, 1).strokeCircle(x, y, this.cellSize * 2);
        }
        return new Promise(res => this.scene.tweens.add({ targets: graphics, alpha: 0, duration: 300, onComplete: () => { graphics.destroy(); res(); } }));
    }

    async showCrossEffect(row, col) {
        const { x, y } = this.gridToWorld(row, col);
        const h = this.scene.add.graphics().fillStyle(0xffffff, 0.8).fillRect(this.x, y - 15, this.cols * this.cellSize, 30);
        const v = this.scene.add.graphics().fillStyle(0xffffff, 0.8).fillRect(x - 15, this.y, 30, this.rows * this.cellSize);
        return new Promise(res => this.scene.tweens.add({ targets: [h, v], alpha: 0, duration: 400, onComplete: () => { h.destroy(); v.destroy(); res(); } }));
    }

    async showBigExplosion(row, col) {
        const { x, y } = this.gridToWorld(row, col);
        const c = this.scene.add.graphics().fillStyle(0xff6600, 0.7).fillCircle(x, y, this.cellSize * 2.5);
        this.scene.cameras.main.shake(200, 0.01);
        return new Promise(res => this.scene.tweens.add({ targets: c, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 400, onComplete: () => { c.destroy(); res(); } }));
    }

    async shuffle() {
        this.inputLocked = true;
        const all = [];
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.grid[r][c] !== -1 && !this.candies[r][c].isSpecial && !this.locked[r][c]) all.push(this.grid[r][c]);
        Phaser.Utils.Array.Shuffle(all);
        let idx = 0;
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.candies[r][c] && !this.candies[r][c].isSpecial && !this.locked[r][c]) {
            const type = all[idx++];
            this.grid[r][c] = type;
            this.candies[r][c].candyType = type;
            this.candies[r][c].setTexture(`candy_${type}`);
            this.scene.tweens.add({ targets: this.candies[r][c], scaleX: 0, duration: 150, yoyo: true });
        }
        await new Promise(r => this.scene.time.delayedCall(300, r));
        if (!this.hasValidMoves()) await this.shuffle();
        this.inputLocked = false;
    }

    getAdjacentCells(row, col) {
        const adj = [];
        [[ -1, 0 ], [ 1, 0 ], [ 0, -1 ], [ 0, 1 ]].forEach(([ dr, dc ]) => {
            if (this.isValidCell(row + dr, col + dc)) adj.push({ row: row + dr, col: col + dc });
        });
        return adj;
    }

    async unlockAdjacentTiles(keys) {
        for (const key of keys) {
            const [ r, c ] = key.split(',').map(Number);
            if (this.locked[r][c]) { this.locked[r][c] = false; this.removeLockSprite(r, c); }
        }
    }

    destroy() {
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
            if (this.candies[r][c]) this.candies[r][c].destroy();
            if (this.jellySprites[r][c]) this.jellySprites[r][c].destroy();
            if (this.lockSprites[r][c]) this.lockSprites[r][c].destroy();
        }
    }
}