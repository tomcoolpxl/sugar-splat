import Candy from './Candy.js';

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
        // jelly[row][col] = 0 (none), 1 (single), 2 (double)
        this.jelly = [];
        this.jellySprites = [];

        // locked[row][col] = true/false
        this.locked = [];
        this.lockSprites = [];

        // Level config for blockers
        this.levelConfig = config.levelConfig || null;

        // Selection state
        this.selectedCandy = null;

        // Lock input during animations
        this.inputLocked = false;

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

        // Apply level blockers if configured
        if (this.levelConfig) {
            this.applyLevelBlockers();
        }

        // Draw cell backgrounds
        this.drawCellBackgrounds();

        // Draw jelly layer (before candies)
        this.drawJellyLayer();

        // Fill the board with candies (no initial matches)
        this.fillBoard();

        // Draw lock overlays (after candies)
        this.drawLockOverlays();
    }

    applyLevelBlockers() {
        // Apply jelly from level config
        if (this.levelConfig.jelly) {
            for (const cell of this.levelConfig.jelly) {
                if (this.isValidCell(cell.row, cell.col)) {
                    this.jelly[cell.row][cell.col] = cell.layers || 1;
                }
            }
        }

        // Apply locked tiles from level config
        if (this.levelConfig.locked) {
            for (const cell of this.levelConfig.locked) {
                if (this.isValidCell(cell.row, cell.col)) {
                    this.locked[cell.row][cell.col] = true;
                }
            }
        }
    }

    drawCellBackgrounds() {
        const graphics = this.scene.add.graphics();
        graphics.setDepth(0);

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const { x, y } = this.gridToWorld(row, col);
                const alpha = (row + col) % 2 === 0 ? 0.1 : 0.15;
                graphics.fillStyle(0xffffff, alpha);
                graphics.fillRoundedRect(
                    x - this.cellSize / 2 + 2,
                    y - this.cellSize / 2 + 2,
                    this.cellSize - 4,
                    this.cellSize - 4,
                    8
                );
            }
        }
    }

    drawJellyLayer() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.jelly[row][col] > 0) {
                    this.createJellySprite(row, col);
                }
            }
        }
    }

    createJellySprite(row, col) {
        const { x, y } = this.gridToWorld(row, col);
        const layers = this.jelly[row][col];

        // Remove existing sprite if any
        if (this.jellySprites[row][col]) {
            this.jellySprites[row][col].destroy();
        }

        // Create jelly graphic
        const jellyGraphics = this.scene.add.graphics();
        jellyGraphics.setDepth(0.5);

        // Color based on layers (darker = more layers)
        const alpha = layers === 2 ? 0.6 : 0.4;
        const color = layers === 2 ? 0xff69b4 : 0xffb6c1;

        jellyGraphics.fillStyle(color, alpha);
        jellyGraphics.fillRoundedRect(
            x - this.cellSize / 2 + 4,
            y - this.cellSize / 2 + 4,
            this.cellSize - 8,
            this.cellSize - 8,
            10
        );

        // Add border for double jelly
        if (layers === 2) {
            jellyGraphics.lineStyle(3, 0xff1493, 0.8);
            jellyGraphics.strokeRoundedRect(
                x - this.cellSize / 2 + 4,
                y - this.cellSize / 2 + 4,
                this.cellSize - 8,
                this.cellSize - 8,
                10
            );
        }

        this.jellySprites[row][col] = jellyGraphics;
    }

    drawLockOverlays() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.locked[row][col]) {
                    this.createLockSprite(row, col);
                }
            }
        }
    }

    createLockSprite(row, col) {
        const { x, y } = this.gridToWorld(row, col);

        // Remove existing sprite if any
        if (this.lockSprites[row][col]) {
            this.lockSprites[row][col].destroy();
        }

        // Create lock graphic (cage/ice appearance)
        const lockGraphics = this.scene.add.graphics();
        lockGraphics.setDepth(2);

        const size = this.cellSize - 8;
        const left = x - size / 2;
        const top = y - size / 2;

        // Ice/cage appearance
        lockGraphics.lineStyle(3, 0x87ceeb, 0.9);

        // Vertical bars
        for (let i = 0; i <= 3; i++) {
            const barX = left + (size / 3) * i;
            lockGraphics.lineBetween(barX, top, barX, top + size);
        }

        // Horizontal bars
        for (let i = 0; i <= 3; i++) {
            const barY = top + (size / 3) * i;
            lockGraphics.lineBetween(left, barY, left + size, barY);
        }

        // Corner accents
        lockGraphics.fillStyle(0x87ceeb, 0.5);
        lockGraphics.fillCircle(left, top, 4);
        lockGraphics.fillCircle(left + size, top, 4);
        lockGraphics.fillCircle(left, top + size, 4);
        lockGraphics.fillCircle(left + size, top + size, 4);

        this.lockSprites[row][col] = lockGraphics;

        // Also disable the candy's interactivity
        const candy = this.candies[row][col];
        if (candy) {
            candy.disableInteractive();
        }
    }

    removeLockSprite(row, col) {
        if (this.lockSprites[row][col]) {
            // Animate lock breaking
            const lockSprite = this.lockSprites[row][col];

            this.scene.tweens.add({
                targets: lockSprite,
                alpha: 0,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    lockSprite.destroy();
                }
            });

            this.lockSprites[row][col] = null;
        }

        // Re-enable candy interactivity
        const candy = this.candies[row][col];
        if (candy) {
            candy.setInteractive({ useHandCursor: true });
        }

        // Emit event for feedback
        this.scene.events.emit('lockBroken', row, col);
    }

    fillBoard() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === -1) {
                    const candyType = this.getValidCandyType(row, col);
                    this.createCandy(row, col, candyType);

                    // If cell is locked, disable interactivity
                    if (this.locked[row][col]) {
                        this.candies[row][col].disableInteractive();
                    }
                }
            }
        }
    }

    getValidCandyType(row, col) {
        const invalidTypes = new Set();

        // Check horizontal (left 2 cells)
        if (col >= 2) {
            const type1 = this.grid[row][col - 1];
            const type2 = this.grid[row][col - 2];
            if (type1 !== -1 && type1 === type2) {
                invalidTypes.add(type1);
            }
        }

        // Check vertical (top 2 cells)
        if (row >= 2) {
            const type1 = this.grid[row - 1][col];
            const type2 = this.grid[row - 2][col];
            if (type1 !== -1 && type1 === type2) {
                invalidTypes.add(type1);
            }
        }

        const validTypes = [];
        for (let i = 0; i < this.candyTypes; i++) {
            if (!invalidTypes.has(i)) {
                validTypes.push(i);
            }
        }

        if (validTypes.length === 0) {
            return Phaser.Math.Between(0, this.candyTypes - 1);
        }

        return Phaser.Utils.Array.GetRandom(validTypes);
    }

    createCandy(row, col, type, animated = false) {
        const { x, y } = this.gridToWorld(row, col);

        const candy = new Candy(this.scene, x, y, type, row, col);
        candy.setDisplaySize(this.cellSize - 12, this.cellSize - 12);
        candy.setDepth(1);

        candy.on('pointerdown', () => this.onCandyClick(candy));

        this.grid[row][col] = type;
        this.candies[row][col] = candy;

        if (animated) {
            candy.y = this.y - this.cellSize;
            candy.setAlpha(0);
            this.scene.tweens.add({
                targets: candy,
                y: y,
                alpha: 1,
                duration: 200 + row * 50,
                ease: 'Bounce.easeOut'
            });
        }

        return candy;
    }

    gridToWorld(row, col) {
        return {
            x: this.x + col * this.cellSize + this.cellSize / 2,
            y: this.y + row * this.cellSize + this.cellSize / 2
        };
    }

    worldToGrid(worldX, worldY) {
        const col = Math.floor((worldX - this.x) / this.cellSize);
        const row = Math.floor((worldY - this.y) / this.cellSize);
        return { row, col };
    }

    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    isAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    onCandyClick(candy) {
        if (this.inputLocked) return;

        // Can't select locked candies - show feedback
        if (this.locked[candy.row][candy.col]) {
            this.showLockedFeedback(candy);
            return;
        }

        if (this.selectedCandy === null) {
            this.selectCandy(candy);
        } else if (this.selectedCandy === candy) {
            this.deselectCandy();
        } else if (this.isAdjacent(this.selectedCandy.row, this.selectedCandy.col, candy.row, candy.col)) {
            // Can't swap with locked candy
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

    showLockedFeedback(candy) {
        // Shake the locked tile
        const startX = candy.x;
        this.scene.tweens.add({
            targets: candy,
            x: startX + 5,
            duration: 50,
            yoyo: true,
            repeat: 3,
            ease: 'Power2',
            onComplete: () => {
                candy.x = startX;
            }
        });

        // Flash the lock overlay
        const lockSprite = this.lockSprites[candy.row][candy.col];
        if (lockSprite) {
            this.scene.tweens.add({
                targets: lockSprite,
                alpha: 0.3,
                duration: 100,
                yoyo: true,
                repeat: 1
            });
        }
    }

    selectCandy(candy) {
        this.selectedCandy = candy;
        candy.select();
    }

    deselectCandy() {
        if (this.selectedCandy) {
            this.selectedCandy.deselect();
            this.selectedCandy = null;
        }
    }

    async trySwap(candy1, candy2) {
        this.inputLocked = true;
        this.deselectCandy();

        // Check for special + special combo BEFORE swap
        const bothSpecial = candy1.isSpecial && candy2.isSpecial;
        const oneSpecial = candy1.isSpecial || candy2.isSpecial;

        // Perform the swap animation
        await this.swapCandies(candy1, candy2);

        // Handle special + special combinations
        if (bothSpecial) {
            this.scene.events.emit('validSwap');
            await this.activateSpecialCombo(candy1, candy2);
            await this.applyGravity();
            await this.fillEmptySpaces();
            await this.processCascades();
            this.inputLocked = false;
            this.scene.events.emit('cascadeComplete');
            return;
        }

        // Check for matches
        const matches = this.findMatches();

        // If one candy is special and gets matched, it activates
        if (matches.length > 0) {
            this.scene.events.emit('validSwap');
            await this.processMatches(matches);
            this.scene.events.emit('cascadeComplete');
        } else if (oneSpecial) {
            // Swapping a special with non-matching candy still activates it
            const specialCandy = candy1.isSpecial ? candy1 : candy2;
            this.scene.events.emit('validSwap');
            await this.activateSpecial(specialCandy);
            await this.applyGravity();
            await this.fillEmptySpaces();
            await this.processCascades();
            this.scene.events.emit('cascadeComplete');
        } else {
            // Invalid swap - revert
            await this.swapCandies(candy1, candy2);
            this.scene.events.emit('invalidSwap');
        }

        this.inputLocked = false;
    }

    swapCandies(candy1, candy2) {
        return new Promise((resolve) => {
            // Swap grid data
            const tempType = this.grid[candy1.row][candy1.col];
            this.grid[candy1.row][candy1.col] = this.grid[candy2.row][candy2.col];
            this.grid[candy2.row][candy2.col] = tempType;

            // Swap sprite references
            this.candies[candy1.row][candy1.col] = candy2;
            this.candies[candy2.row][candy2.col] = candy1;

            // Swap row/col properties
            const tempRow = candy1.row;
            const tempCol = candy1.col;
            candy1.row = candy2.row;
            candy1.col = candy2.col;
            candy2.row = tempRow;
            candy2.col = tempCol;

            // Animate the swap
            const pos1 = this.gridToWorld(candy1.row, candy1.col);
            const pos2 = this.gridToWorld(candy2.row, candy2.col);

            this.scene.tweens.add({
                targets: candy1,
                x: pos1.x,
                y: pos1.y,
                duration: 150,
                ease: 'Power2'
            });

            this.scene.tweens.add({
                targets: candy2,
                x: pos2.x,
                y: pos2.y,
                duration: 150,
                ease: 'Power2',
                onComplete: resolve
            });
        });
    }

    findMatches() {
        const matches = [];

        // Find all horizontal matches first
        const horizontalMatches = [];
        for (let row = 0; row < this.rows; row++) {
            let col = 0;
            while (col < this.cols) {
                const type = this.grid[row][col];
                if (type === -1 || this.locked[row][col]) {
                    col++;
                    continue;
                }

                let matchLength = 1;
                while (col + matchLength < this.cols &&
                       this.grid[row][col + matchLength] === type &&
                       !this.locked[row][col + matchLength]) {
                    matchLength++;
                }

                if (matchLength >= 3) {
                    const cells = [];
                    for (let i = 0; i < matchLength; i++) {
                        cells.push({ row, col: col + i });
                    }
                    horizontalMatches.push({
                        type,
                        cells,
                        direction: 'horizontal',
                        length: matchLength,
                        startRow: row,
                        startCol: col
                    });
                }
                col += Math.max(1, matchLength);
            }
        }

        // Find all vertical matches
        const verticalMatches = [];
        for (let col = 0; col < this.cols; col++) {
            let row = 0;
            while (row < this.rows) {
                const type = this.grid[row][col];
                if (type === -1 || this.locked[row][col]) {
                    row++;
                    continue;
                }

                let matchLength = 1;
                while (row + matchLength < this.rows &&
                       this.grid[row + matchLength][col] === type &&
                       !this.locked[row + matchLength][col]) {
                    matchLength++;
                }

                if (matchLength >= 3) {
                    const cells = [];
                    for (let i = 0; i < matchLength; i++) {
                        cells.push({ row: row + i, col });
                    }
                    verticalMatches.push({
                        type,
                        cells,
                        direction: 'vertical',
                        length: matchLength,
                        startRow: row,
                        startCol: col
                    });
                }
                row += Math.max(1, matchLength);
            }
        }

        // Detect T and L shapes by finding intersections
        const intersections = this.findIntersections(horizontalMatches, verticalMatches);

        // Process matches and determine special tiles to create
        for (const hMatch of horizontalMatches) {
            const intersection = intersections.find(i =>
                i.horizontal === hMatch || i.vertical === hMatch
            );

            if (intersection) {
                continue;
            }

            matches.push(this.createMatchObject(hMatch, null));
        }

        for (const vMatch of verticalMatches) {
            const intersection = intersections.find(i =>
                i.horizontal === vMatch || i.vertical === vMatch
            );

            if (intersection) {
                continue;
            }

            matches.push(this.createMatchObject(vMatch, null));
        }

        // Add intersection matches (T and L shapes)
        for (const intersection of intersections) {
            matches.push(this.createIntersectionMatch(intersection));
        }

        return matches;
    }

    findIntersections(horizontalMatches, verticalMatches) {
        const intersections = [];

        for (const hMatch of horizontalMatches) {
            for (const vMatch of verticalMatches) {
                if (hMatch.type !== vMatch.type) continue;

                for (const hCell of hMatch.cells) {
                    for (const vCell of vMatch.cells) {
                        if (hCell.row === vCell.row && hCell.col === vCell.col) {
                            intersections.push({
                                horizontal: hMatch,
                                vertical: vMatch,
                                intersectCell: hCell,
                                type: hMatch.type
                            });
                        }
                    }
                }
            }
        }

        return intersections;
    }

    createMatchObject(match, intersection) {
        const result = {
            type: match.type,
            cells: [...match.cells],
            direction: match.direction,
            length: match.length,
            specialToCreate: null,
            specialPosition: null
        };

        if (match.length === 4) {
            result.specialToCreate = match.direction === 'horizontal' ? 'line_h' : 'line_v';
            const midIndex = Math.floor(match.cells.length / 2);
            result.specialPosition = match.cells[midIndex];
        } else if (match.length >= 5) {
            result.specialToCreate = 'bomb';
            const midIndex = Math.floor(match.cells.length / 2);
            result.specialPosition = match.cells[midIndex];
        }

        return result;
    }

    createIntersectionMatch(intersection) {
        const allCells = [];
        const cellSet = new Set();

        for (const cell of intersection.horizontal.cells) {
            const key = `${cell.row},${cell.col}`;
            if (!cellSet.has(key)) {
                allCells.push(cell);
                cellSet.add(key);
            }
        }

        for (const cell of intersection.vertical.cells) {
            const key = `${cell.row},${cell.col}`;
            if (!cellSet.has(key)) {
                allCells.push(cell);
                cellSet.add(key);
            }
        }

        return {
            type: intersection.type,
            cells: allCells,
            direction: 'intersection',
            length: allCells.length,
            specialToCreate: 'bomb',
            specialPosition: intersection.intersectCell
        };
    }

    async processMatches(matches) {
        let cascadeLevel = 0;

        while (matches.length > 0) {
            cascadeLevel++;

            const cellsToClear = new Map();
            const specialsToCreate = [];
            const adjacentToMatches = new Set();
            const specialsToAnimate = []; // Track specials that need visual effects

            for (const match of matches) {
                // Check if any candy in this match is already a special that should activate
                for (const cell of match.cells) {
                    const candy = this.candies[cell.row][cell.col];
                    if (candy && candy.isSpecial) {
                        // Track this special for animation
                        specialsToAnimate.push(candy);

                        const additionalCells = await this.getSpecialActivationCells(candy);
                        for (const addCell of additionalCells) {
                            const key = `${addCell.row},${addCell.col}`;
                            if (!cellsToClear.has(key)) {
                                cellsToClear.set(key, addCell);
                            }
                        }
                    }

                    // Track cells adjacent to this match (for unlocking)
                    this.getAdjacentCells(cell.row, cell.col).forEach(adj => {
                        adjacentToMatches.add(`${adj.row},${adj.col}`);
                    });
                }

                for (const cell of match.cells) {
                    const key = `${cell.row},${cell.col}`;
                    if (!cellsToClear.has(key)) {
                        cellsToClear.set(key, cell);
                    }
                }

                if (match.specialToCreate && match.specialPosition) {
                    specialsToCreate.push({
                        type: match.specialToCreate,
                        position: match.specialPosition,
                        candyType: match.type
                    });
                }
            }

            // Show visual effects for all specials being activated
            for (const special of specialsToAnimate) {
                await this.showSpecialActivation(special);
            }

            // Unlock adjacent locked tiles
            await this.unlockAdjacentTiles(adjacentToMatches);

            // Calculate score
            const score = this.calculateScore(cellsToClear.size, cascadeLevel);
            this.scene.events.emit('scoreUpdate', score, cascadeLevel);

            // Clear candies and handle jelly
            const clearList = Array.from(cellsToClear.values());
            await this.clearCandiesWithSpecials(clearList, specialsToCreate);

            // Apply gravity
            await this.applyGravity();

            // Fill empty spaces
            await this.fillEmptySpaces();

            // Check for new matches (cascade)
            matches = this.findMatches();
        }
    }

    getAdjacentCells(row, col) {
        const adjacent = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidCell(newRow, newCol)) {
                adjacent.push({ row: newRow, col: newCol });
            }
        }

        return adjacent;
    }

    async unlockAdjacentTiles(adjacentCells) {
        const unlocked = [];

        for (const key of adjacentCells) {
            const [row, col] = key.split(',').map(Number);
            if (this.locked[row][col]) {
                this.locked[row][col] = false;
                this.removeLockSprite(row, col);
                unlocked.push({ row, col });
            }
        }

        if (unlocked.length > 0) {
            // Small delay for unlock animation
            await new Promise(resolve => this.scene.time.delayedCall(150, resolve));
        }
    }

    async processCascades() {
        let matches = this.findMatches();
        let cascadeLevel = 0;

        while (matches.length > 0) {
            cascadeLevel++;

            const cellsToClear = new Map();
            const specialsToCreate = [];
            const adjacentToMatches = new Set();
            const specialsToAnimate = []; // Track specials that need visual effects

            for (const match of matches) {
                for (const cell of match.cells) {
                    const candy = this.candies[cell.row][cell.col];
                    if (candy && candy.isSpecial) {
                        // Track this special for animation
                        specialsToAnimate.push(candy);

                        const additionalCells = await this.getSpecialActivationCells(candy);
                        for (const addCell of additionalCells) {
                            const key = `${addCell.row},${addCell.col}`;
                            if (!cellsToClear.has(key)) {
                                cellsToClear.set(key, addCell);
                            }
                        }
                    }

                    this.getAdjacentCells(cell.row, cell.col).forEach(adj => {
                        adjacentToMatches.add(`${adj.row},${adj.col}`);
                    });
                }

                for (const cell of match.cells) {
                    const key = `${cell.row},${cell.col}`;
                    if (!cellsToClear.has(key)) {
                        cellsToClear.set(key, cell);
                    }
                }

                if (match.specialToCreate && match.specialPosition) {
                    specialsToCreate.push({
                        type: match.specialToCreate,
                        position: match.specialPosition,
                        candyType: match.type
                    });
                }
            }

            // Show visual effects for all specials being activated
            for (const special of specialsToAnimate) {
                await this.showSpecialActivation(special);
            }

            await this.unlockAdjacentTiles(adjacentToMatches);

            const score = this.calculateScore(cellsToClear.size, cascadeLevel);
            this.scene.events.emit('scoreUpdate', score, cascadeLevel);

            const clearList = Array.from(cellsToClear.values());
            await this.clearCandiesWithSpecials(clearList, specialsToCreate);
            await this.applyGravity();
            await this.fillEmptySpaces();

            matches = this.findMatches();
        }
    }

    async getSpecialActivationCells(candy) {
        const cells = [];
        const row = candy.row;
        const col = candy.col;

        if (candy.specialType === 'line_h') {
            for (let c = 0; c < this.cols; c++) {
                if (this.candies[row][c]) {
                    cells.push({ row, col: c });
                }
            }
        } else if (candy.specialType === 'line_v') {
            for (let r = 0; r < this.rows; r++) {
                if (this.candies[r][col]) {
                    cells.push({ row: r, col });
                }
            }
        } else if (candy.specialType === 'bomb') {
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (this.isValidCell(r, c) && this.candies[r][c]) {
                        cells.push({ row: r, col: c });
                    }
                }
            }
        }

        return cells;
    }

    async activateSpecial(candy) {
        const cells = await this.getSpecialActivationCells(candy);

        this.scene.events.emit('specialActivated', candy.specialType, candy.row, candy.col);

        await this.showSpecialActivation(candy);

        // Unlock adjacent tiles for special activation too
        const adjacentCells = new Set();
        for (const cell of cells) {
            this.getAdjacentCells(cell.row, cell.col).forEach(adj => {
                adjacentCells.add(`${adj.row},${adj.col}`);
            });
        }
        await this.unlockAdjacentTiles(adjacentCells);

        const score = this.calculateScore(cells.length, 1) + 50;
        this.scene.events.emit('scoreUpdate', score, 1);

        const specialsToActivate = [];
        for (const cell of cells) {
            const targetCandy = this.candies[cell.row][cell.col];
            if (targetCandy && targetCandy.isSpecial && targetCandy !== candy) {
                specialsToActivate.push(targetCandy);
            }
        }

        await this.clearCandies(cells);

        for (const special of specialsToActivate) {
            if (this.candies[special.row] && this.candies[special.row][special.col] === null) {
                continue;
            }
            await this.activateSpecial(special);
        }
    }

    async activateSpecialCombo(candy1, candy2) {
        const type1 = candy1.specialType;
        const type2 = candy2.specialType;

        let cells = [];

        if ((type1 === 'line_h' && type2 === 'line_v') ||
            (type1 === 'line_v' && type2 === 'line_h')) {
            const row = candy1.row;
            const col = candy1.col;

            for (let c = 0; c < this.cols; c++) {
                if (this.candies[row][c]) cells.push({ row, col: c });
            }
            for (let r = 0; r < this.rows; r++) {
                if (this.candies[r][col] && r !== row) cells.push({ row: r, col });
            }

            await this.showCrossEffect(row, col);
        } else if ((type1 === 'bomb' && type2 === 'bomb')) {
            const row = candy1.row;
            const col = candy1.col;

            for (let r = row - 2; r <= row + 2; r++) {
                for (let c = col - 2; c <= col + 2; c++) {
                    if (this.isValidCell(r, c) && this.candies[r][c]) {
                        cells.push({ row: r, col: c });
                    }
                }
            }

            await this.showBigExplosion(row, col);
        } else if ((type1 === 'bomb' || type2 === 'bomb')) {
            const bombCandy = type1 === 'bomb' ? candy1 : candy2;
            const lineCandy = type1 === 'bomb' ? candy2 : candy1;
            const row = bombCandy.row;
            const col = bombCandy.col;

            if (lineCandy.specialType === 'line_h') {
                for (let r = row - 1; r <= row + 1; r++) {
                    if (r >= 0 && r < this.rows) {
                        for (let c = 0; c < this.cols; c++) {
                            if (this.candies[r][c]) cells.push({ row: r, col: c });
                        }
                    }
                }
            } else {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (c >= 0 && c < this.cols) {
                        for (let r = 0; r < this.rows; r++) {
                            if (this.candies[r][c]) cells.push({ row: r, col: c });
                        }
                    }
                }
            }

            await this.showBigExplosion(row, col);
        } else {
            const row = candy1.row;
            const col = candy1.col;

            for (let c = 0; c < this.cols; c++) {
                if (this.candies[row][c]) cells.push({ row, col: c });
            }
            for (let r = 0; r < this.rows; r++) {
                if (this.candies[r][col] && r !== row) cells.push({ row: r, col });
            }

            await this.showCrossEffect(row, col);
        }

        // Unlock adjacent tiles
        const adjacentCells = new Set();
        for (const cell of cells) {
            this.getAdjacentCells(cell.row, cell.col).forEach(adj => {
                adjacentCells.add(`${adj.row},${adj.col}`);
            });
        }
        await this.unlockAdjacentTiles(adjacentCells);

        const score = this.calculateScore(cells.length, 1) + 100;
        this.scene.events.emit('scoreUpdate', score, 1);

        await this.clearCandies(cells);
    }

    async showSpecialActivation(candy) {
        return new Promise(resolve => {
            const { x, y } = this.gridToWorld(candy.row, candy.col);

            if (candy.specialType === 'line_h') {
                const beam = this.scene.add.graphics();
                beam.fillStyle(0xffffff, 0.8);
                beam.fillRect(this.x, y - 10, this.cols * this.cellSize, 20);

                this.scene.tweens.add({
                    targets: beam,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        beam.destroy();
                        resolve();
                    }
                });
            } else if (candy.specialType === 'line_v') {
                const beam = this.scene.add.graphics();
                beam.fillStyle(0xffffff, 0.8);
                beam.fillRect(x - 10, this.y, 20, this.rows * this.cellSize);

                this.scene.tweens.add({
                    targets: beam,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        beam.destroy();
                        resolve();
                    }
                });
            } else if (candy.specialType === 'bomb') {
                const circle = this.scene.add.graphics();
                circle.fillStyle(0xffff00, 0.6);
                circle.fillCircle(x, y, this.cellSize * 1.5);

                this.scene.tweens.add({
                    targets: circle,
                    alpha: 0,
                    scaleX: 2,
                    scaleY: 2,
                    duration: 300,
                    onComplete: () => {
                        circle.destroy();
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    async showCrossEffect(row, col) {
        return new Promise(resolve => {
            const { x, y } = this.gridToWorld(row, col);

            const hBeam = this.scene.add.graphics();
            hBeam.fillStyle(0xffffff, 0.8);
            hBeam.fillRect(this.x, y - 15, this.cols * this.cellSize, 30);

            const vBeam = this.scene.add.graphics();
            vBeam.fillStyle(0xffffff, 0.8);
            vBeam.fillRect(x - 15, this.y, 30, this.rows * this.cellSize);

            this.scene.tweens.add({
                targets: [hBeam, vBeam],
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    hBeam.destroy();
                    vBeam.destroy();
                    resolve();
                }
            });
        });
    }

    async showBigExplosion(row, col) {
        return new Promise(resolve => {
            const { x, y } = this.gridToWorld(row, col);

            const circle = this.scene.add.graphics();
            circle.fillStyle(0xff6600, 0.7);
            circle.fillCircle(x, y, this.cellSize * 2.5);

            this.scene.cameras.main.shake(200, 0.01);

            this.scene.tweens.add({
                targets: circle,
                alpha: 0,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 400,
                onComplete: () => {
                    circle.destroy();
                    resolve();
                }
            });
        });
    }

    async clearCandiesWithSpecials(cells, specialsToCreate) {
        return new Promise((resolve) => {
            const specialPositions = new Set(
                specialsToCreate.map(s => `${s.position.row},${s.position.col}`)
            );

            const cellsToClear = cells.filter(cell => {
                const key = `${cell.row},${cell.col}`;
                return !specialPositions.has(key);
            });

            let completed = 0;
            const total = cellsToClear.length + specialsToCreate.length;

            if (total === 0) {
                resolve();
                return;
            }

            // Clear regular cells
            cellsToClear.forEach((cell, index) => {
                const candy = this.candies[cell.row][cell.col];
                if (candy) {
                    // Handle jelly
                    this.handleJellyAt(cell.row, cell.col);

                    this.grid[cell.row][cell.col] = -1;
                    this.candies[cell.row][cell.col] = null;

                    this.scene.tweens.add({
                        targets: candy,
                        scaleX: 0,
                        scaleY: 0,
                        alpha: 0,
                        duration: 200,
                        delay: index * 20,
                        ease: 'Back.easeIn',
                        onComplete: () => {
                            candy.destroy();
                            completed++;
                            if (completed === total) resolve();
                        }
                    });

                    this.scene.events.emit('candyCleared', cell.row, cell.col, candy.candyType);
                } else {
                    completed++;
                    if (completed === total) resolve();
                }
            });

            // Create special tiles
            specialsToCreate.forEach((special) => {
                const { row, col } = special.position;
                const oldCandy = this.candies[row][col];

                // Handle jelly at special position too
                this.handleJellyAt(row, col);

                if (oldCandy) {
                    this.scene.tweens.add({
                        targets: oldCandy,
                        scaleX: 1.3,
                        scaleY: 1.3,
                        duration: 150,
                        yoyo: true,
                        onComplete: () => {
                            oldCandy.makeSpecial(special.type);
                            completed++;
                            if (completed === total) resolve();
                        }
                    });
                } else {
                    const { x, y } = this.gridToWorld(row, col);
                    const newCandy = new Candy(this.scene, x, y, special.candyType, row, col);
                    newCandy.setDisplaySize(this.cellSize - 12, this.cellSize - 12);
                    newCandy.setDepth(1);
                    newCandy.on('pointerdown', () => this.onCandyClick(newCandy));
                    newCandy.makeSpecial(special.type);

                    this.grid[row][col] = special.candyType;
                    this.candies[row][col] = newCandy;

                    newCandy.setScale(0);
                    this.scene.tweens.add({
                        targets: newCandy,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 200,
                        ease: 'Back.easeOut',
                        onComplete: () => {
                            completed++;
                            if (completed === total) resolve();
                        }
                    });
                }
            });
        });
    }

    handleJellyAt(row, col) {
        if (this.jelly[row][col] > 0) {
            this.jelly[row][col]--;

            if (this.jelly[row][col] === 0) {
                // Jelly fully cleared
                if (this.jellySprites[row][col]) {
                    this.animateJellyClear(row, col);
                }
                this.scene.events.emit('jellyCleared', row, col);
            } else {
                // Double jelly reduced to single
                this.createJellySprite(row, col);
                this.scene.events.emit('jellyHit', row, col);
            }
        }
    }

    animateJellyClear(row, col) {
        const jellySprite = this.jellySprites[row][col];
        if (jellySprite) {
            this.scene.tweens.add({
                targets: jellySprite,
                alpha: 0,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 200,
                onComplete: () => {
                    jellySprite.destroy();
                }
            });
            this.jellySprites[row][col] = null;
        }
    }

    calculateScore(tilesCleared, cascadeLevel) {
        const baseScore = 10 * tilesCleared;
        const multiplier = Math.pow(1.5, cascadeLevel - 1);
        return Math.floor(baseScore * multiplier);
    }

    clearCandies(cells) {
        return new Promise((resolve) => {
            let completed = 0;
            const total = cells.length;

            if (total === 0) {
                resolve();
                return;
            }

            cells.forEach((cell, index) => {
                const candy = this.candies[cell.row][cell.col];
                if (candy) {
                    // Handle jelly
                    this.handleJellyAt(cell.row, cell.col);

                    // Handle locked (shouldn't happen but just in case)
                    if (this.locked[cell.row][cell.col]) {
                        this.locked[cell.row][cell.col] = false;
                        this.removeLockSprite(cell.row, cell.col);
                    }

                    this.grid[cell.row][cell.col] = -1;
                    this.candies[cell.row][cell.col] = null;

                    this.scene.tweens.add({
                        targets: candy,
                        scaleX: 0,
                        scaleY: 0,
                        alpha: 0,
                        duration: 200,
                        delay: index * 20,
                        ease: 'Back.easeIn',
                        onComplete: () => {
                            candy.destroy();
                            completed++;
                            if (completed === total) resolve();
                        }
                    });

                    this.scene.events.emit('candyCleared', cell.row, cell.col, candy.candyType);
                } else {
                    completed++;
                    if (completed === total) resolve();
                }
            });
        });
    }

    applyGravity() {
        return new Promise((resolve) => {
            const tweens = [];

            for (let col = 0; col < this.cols; col++) {
                let emptyRow = this.rows - 1;

                for (let row = this.rows - 1; row >= 0; row--) {
                    if (this.grid[row][col] !== -1) {
                        if (row !== emptyRow) {
                            const candy = this.candies[row][col];

                            this.grid[emptyRow][col] = this.grid[row][col];
                            this.grid[row][col] = -1;
                            this.candies[emptyRow][col] = candy;
                            this.candies[row][col] = null;

                            const oldRow = candy.row;
                            candy.row = emptyRow;

                            const targetPos = this.gridToWorld(emptyRow, col);
                            const distance = emptyRow - oldRow;

                            tweens.push({
                                targets: candy,
                                y: targetPos.y,
                                duration: 100 + distance * 50,
                                ease: 'Bounce.easeOut'
                            });
                        }
                        emptyRow--;
                    }
                }
            }

            if (tweens.length === 0) {
                resolve();
                return;
            }

            let completed = 0;
            tweens.forEach(config => {
                this.scene.tweens.add({
                    ...config,
                    onComplete: () => {
                        completed++;
                        if (completed === tweens.length) resolve();
                    }
                });
            });
        });
    }

    fillEmptySpaces() {
        return new Promise((resolve) => {
            const tweens = [];

            for (let col = 0; col < this.cols; col++) {
                let emptyCount = 0;

                for (let row = 0; row < this.rows; row++) {
                    if (this.grid[row][col] === -1) {
                        emptyCount++;
                    }
                }

                for (let row = 0; row < this.rows; row++) {
                    if (this.grid[row][col] === -1) {
                        const candyType = this.getValidCandyType(row, col);
                        const { x, y } = this.gridToWorld(row, col);

                        const candy = new Candy(this.scene, x, this.y - this.cellSize * (emptyCount - row), candyType, row, col);
                        candy.setDisplaySize(this.cellSize - 12, this.cellSize - 12);
                        candy.setDepth(1);
                        candy.on('pointerdown', () => this.onCandyClick(candy));

                        this.grid[row][col] = candyType;
                        this.candies[row][col] = candy;

                        tweens.push({
                            targets: candy,
                            y: y,
                            duration: 200 + row * 50,
                            ease: 'Bounce.easeOut'
                        });
                    }
                }
            }

            if (tweens.length === 0) {
                resolve();
                return;
            }

            let completed = 0;
            tweens.forEach(config => {
                this.scene.tweens.add({
                    ...config,
                    onComplete: () => {
                        completed++;
                        if (completed === tweens.length) resolve();
                    }
                });
            });
        });
    }

    hasValidMoves() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                // Skip locked cells
                if (this.locked[row][col]) continue;

                const candy = this.candies[row][col];
                if (candy && candy.isSpecial) {
                    // Check if special can swap with unlocked adjacent
                    if (col < this.cols - 1 && this.candies[row][col + 1] && !this.locked[row][col + 1]) return true;
                    if (row < this.rows - 1 && this.candies[row + 1][col] && !this.locked[row + 1][col]) return true;
                }

                // Try swap right (skip if either is locked)
                if (col < this.cols - 1 && !this.locked[row][col + 1]) {
                    this.swapGridData(row, col, row, col + 1);
                    if (this.findMatches().length > 0) {
                        this.swapGridData(row, col, row, col + 1);
                        return true;
                    }
                    this.swapGridData(row, col, row, col + 1);
                }

                // Try swap down
                if (row < this.rows - 1 && !this.locked[row + 1][col]) {
                    this.swapGridData(row, col, row + 1, col);
                    if (this.findMatches().length > 0) {
                        this.swapGridData(row, col, row + 1, col);
                        return true;
                    }
                    this.swapGridData(row, col, row + 1, col);
                }
            }
        }

        return false;
    }

    swapGridData(row1, col1, row2, col2) {
        const temp = this.grid[row1][col1];
        this.grid[row1][col1] = this.grid[row2][col2];
        this.grid[row2][col2] = temp;
    }

    findValidMove() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.locked[row][col]) continue;

                if (col < this.cols - 1 && !this.locked[row][col + 1]) {
                    this.swapGridData(row, col, row, col + 1);
                    if (this.findMatches().length > 0) {
                        this.swapGridData(row, col, row, col + 1);
                        return [
                            { row, col },
                            { row, col: col + 1 }
                        ];
                    }
                    this.swapGridData(row, col, row, col + 1);
                }

                if (row < this.rows - 1 && !this.locked[row + 1][col]) {
                    this.swapGridData(row, col, row + 1, col);
                    if (this.findMatches().length > 0) {
                        this.swapGridData(row, col, row + 1, col);
                        return [
                            { row, col },
                            { row: row + 1, col }
                        ];
                    }
                    this.swapGridData(row, col, row + 1, col);
                }
            }
        }

        return null;
    }

    async shuffle(attempts = 0) {
        const maxAttempts = 10;

        // Safety check to prevent infinite recursion
        if (attempts >= maxAttempts) {
            console.warn('Shuffle: Max attempts reached, forcing valid board');
            // Force regenerate the entire board as last resort
            await this.forceRegenerateBoard();
            this.inputLocked = false;
            return;
        }

        this.inputLocked = true;

        const allCandies = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] !== -1 &&
                    this.candies[row][col] &&
                    !this.candies[row][col].isSpecial &&
                    !this.locked[row][col]) {
                    allCandies.push(this.grid[row][col]);
                }
            }
        }

        Phaser.Utils.Array.Shuffle(allCandies);

        let index = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const candy = this.candies[row][col];
                if (candy && !candy.isSpecial && !this.locked[row][col]) {
                    const newType = allCandies[index++];
                    this.grid[row][col] = newType;
                    candy.candyType = newType;
                    candy.setTexture(`candy_${newType}`);

                    this.scene.tweens.add({
                        targets: candy,
                        scaleX: 0,
                        duration: 150,
                        yoyo: true,
                        ease: 'Power2'
                    });
                }
            }
        }

        await new Promise(resolve => this.scene.time.delayedCall(300, resolve));

        if (!this.hasValidMoves()) {
            await this.shuffle(attempts + 1);
            return;
        }

        this.inputLocked = false;
    }

    async forceRegenerateBoard() {
        // Destroy all non-special, non-locked candies and regenerate
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const candy = this.candies[row][col];
                if (candy && !candy.isSpecial && !this.locked[row][col]) {
                    candy.destroy();
                    this.candies[row][col] = null;
                    this.grid[row][col] = -1;
                }
            }
        }

        // Refill with valid candy types (no initial matches)
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === -1) {
                    const candyType = this.getValidCandyType(row, col);
                    this.createCandy(row, col, candyType, true);
                }
            }
        }

        await new Promise(resolve => this.scene.time.delayedCall(500, resolve));
    }

    destroy() {
        // Clean up all candies, jelly sprites, and lock sprites
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.candies[row] && this.candies[row][col]) {
                    this.candies[row][col].destroy();
                    this.candies[row][col] = null;
                }
                if (this.jellySprites[row] && this.jellySprites[row][col]) {
                    this.jellySprites[row][col].destroy();
                    this.jellySprites[row][col] = null;
                }
                if (this.lockSprites[row] && this.lockSprites[row][col]) {
                    this.lockSprites[row][col].destroy();
                    this.lockSprites[row][col] = null;
                }
            }
        }
    }

    // Helper to count remaining jelly
    countRemainingJelly() {
        let count = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                count += this.jelly[row][col];
            }
        }
        return count;
    }

    // Helper to count remaining locked tiles
    countRemainingLocked() {
        let count = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.locked[row][col]) count++;
            }
        }
        return count;
    }

    destroy() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.candies[row][col]) {
                    this.candies[row][col].destroy();
                }
                if (this.jellySprites[row][col]) {
                    this.jellySprites[row][col].destroy();
                }
                if (this.lockSprites[row][col]) {
                    this.lockSprites[row][col].destroy();
                }
            }
        }
    }
}
