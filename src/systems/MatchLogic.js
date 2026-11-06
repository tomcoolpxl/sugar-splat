export default class MatchLogic {
    constructor(board) {
        this.board = board;
    }

    canMatch(r, c) {
        if (!this.board.isValidCell(r, c)) return false;
        if (this.board.stone[r][c]) return false;
        if (this.board.chocolate[r][c]) return false;
        if (this.board.crate[r][c] > 0) return false;
        const type = this.board.grid[r][c];
        if (type === -1 || type >= 90) return false;
        return true;
    }

    findMatches() {
        const matches = [];
        const { rows, cols, grid } = this.board;
        const canMatch = (r, c) => this.canMatch(r, c);

        // 1. Horizontal Matches
        for (let row = 0; row < rows; row++) {
            let col = 0;
            while (col < cols) {
                if (!canMatch(row, col)) {
                    col++;
                    continue;
                }

                const type = grid[row][col];

                let matchLength = 1;
                while (col + matchLength < cols &&
                       canMatch(row, col + matchLength) &&
                       grid[row][col + matchLength] === type) {
                    matchLength++;
                }

                if (matchLength >= 3) {
                    const cells = [];
                    for (let i = 0; i < matchLength; i++) {
                        cells.push({ row, col: col + i });
                    }
                    matches.push({
                        type,
                        cells,
                        direction: 'horizontal',
                        length: matchLength
                    });
                }
                col += Math.max(1, matchLength);
            }
        }

        // 2. Vertical Matches
        const verticalMatches = [];
        for (let col = 0; col < cols; col++) {
            let row = 0;
            while (row < rows) {
                if (!canMatch(row, col)) {
                    row++;
                    continue;
                }

                const type = grid[row][col];

                let matchLength = 1;
                while (row + matchLength < rows &&
                       canMatch(row + matchLength, col) &&
                       grid[row + matchLength][col] === type) {
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
                        length: matchLength
                    });
                }
                row += Math.max(1, matchLength);
            }
        }

        // 3. Find Intersections (T and L shapes)
        const intersections = this.findIntersections(matches, verticalMatches);
        const finalMatches = [];

        // Filter out horizontal matches that are part of an intersection
        for (const hMatch of matches) {
            if (!intersections.some(i => i.horizontal === hMatch)) {
                finalMatches.push(this.createMatchObject(hMatch));
            }
        }

        // Filter out vertical matches that are part of an intersection
        for (const vMatch of verticalMatches) {
            if (!intersections.some(i => i.vertical === vMatch)) {
                finalMatches.push(this.createMatchObject(vMatch));
            }
        }

        // Add intersections as single match objects
        for (const intersection of intersections) {
            finalMatches.push(this.createIntersectionMatch(intersection));
        }

        return finalMatches;
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

    createMatchObject(match) {
        const result = {
            type: match.type,
            cells: [...match.cells],
            specialToCreate: null,
            specialPosition: null
        };

        const isExistingSpecial = (c) => Boolean(this.board.candies?.[c.row]?.[c.col]?.isSpecial);

        const pickSpecialPos = () => {
            if (this.board.lastSwappedCells && this.board.lastSwappedCells.length > 0) {
                // First prefer a swapped cell that is not already a special candy
                for (const swapped of this.board.lastSwappedCells) {
                    const found = match.cells.find(c => c.row === swapped.row && c.col === swapped.col && !isExistingSpecial(c));
                    if (found) return found;
                }
            }
            // Otherwise prefer the middle-most non-special cell in the match so existing specials detonate
            const midIdx = Math.floor(match.length / 2);
            if (!isExistingSpecial(match.cells[midIdx])) {
                return match.cells[midIdx];
            }
            const nonSpecialCell = match.cells.find(c => !isExistingSpecial(c));
            return nonSpecialCell || match.cells[midIdx];
        };

        if (match.length === 4) {
            result.specialToCreate = match.direction === 'horizontal' ? 'line_h' : 'line_v';
            result.specialPosition = pickSpecialPos();
        } else if (match.length >= 5) {
            result.specialToCreate = 'color_bomb';
            result.specialPosition = pickSpecialPos();
        }

        return result;
    }

    createIntersectionMatch(intersection) {
        const allCells = [];
        const cellSet = new Set();

        [...intersection.horizontal.cells, ...intersection.vertical.cells].forEach(cell => {
            const key = `${cell.row},${cell.col}`;
            if (!cellSet.has(key)) {
                allCells.push(cell);
                cellSet.add(key);
            }
        });

        const isExistingSpecial = (c) => Boolean(this.board.candies?.[c.row]?.[c.col]?.isSpecial);
        let specialPosition = intersection.intersectCell;
        if (isExistingSpecial(specialPosition)) {
            const nonSpecialSwapped = (this.board.lastSwappedCells || [])
                .map(s => allCells.find(c => c.row === s.row && c.col === s.col && !isExistingSpecial(c)))
                .find(Boolean);
            specialPosition = nonSpecialSwapped || allCells.find(c => !isExistingSpecial(c)) || intersection.intersectCell;
        }

        return {
            type: intersection.type,
            cells: allCells,
            specialToCreate: 'bomb',
            specialPosition
        };
    }

    hasValidMoves() {
        const { rows, cols, candies, stone, chocolate } = this.board;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Skip stone and chocolate cells (they block entirely)
                if (stone[row][col] || chocolate[row][col]) continue;

                // Check if this cell can be swapped (ice, chains, honey, crate, locked block swaps)
                if (!this.board.canSwapAt(row, col)) continue;

                const candy = candies[row][col];
                // Specials that can be swapped can be activated
                if (candy && candy.isSpecial) return true;

                // Try swap right
                if (col < cols - 1 && !stone[row][col + 1] && !chocolate[row][col + 1] &&
                    this.board.canSwapAt(row, col + 1) &&
                    !this.board.hasLicoriceWall(row, col, row, col + 1)) {
                    this.swapGridData(row, col, row, col + 1);
                    if (this.findMatches().length > 0) {
                        this.swapGridData(row, col, row, col + 1);
                        return true;
                    }
                    this.swapGridData(row, col, row, col + 1);
                }

                // Try swap down
                if (row < rows - 1 && !stone[row + 1][col] && !chocolate[row + 1][col] &&
                    this.board.canSwapAt(row + 1, col) &&
                    !this.board.hasLicoriceWall(row, col, row + 1, col)) {
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

    findValidMove() {
        const { rows, cols, candies, stone, chocolate } = this.board;
        let bestMove = null;
        let bestScore = -1;
        let fallbackSpecialTap = null;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Skip stone and chocolate cells
                if (stone[row][col] || chocolate[row][col]) continue;

                // Check if this cell can be swapped
                if (!this.board.canSwapAt(row, col)) continue;

                const c1 = candies[row][col];
                if (c1 && c1.isSpecial && !fallbackSpecialTap) {
                    fallbackSpecialTap = [{ row, col }];
                }

                // Try swap right
                if (col < cols - 1 && !stone[row][col + 1] && !chocolate[row][col + 1] &&
                    this.board.canSwapAt(row, col + 1) &&
                    !this.board.hasLicoriceWall(row, col, row, col + 1)) {
                    const c2 = candies[row][col + 1];
                    if (c1 && c2 && c1.isSpecial && c2.isSpecial && bestScore < 280) {
                        bestScore = 280;
                        bestMove = [{ row, col }, { row, col: col + 1 }];
                    } else if (c1 && c2 && (c1.isSpecial || c2.isSpecial)) {
                        const special = c1.isSpecial ? c1 : c2;
                        const other = c1.isSpecial ? c2 : c1;
                        if (!(special.specialType === 'color_bomb' && other.isIngredient) && bestScore < 85) {
                            bestScore = 85;
                            bestMove = [{ row, col }, { row, col: col + 1 }];
                        }
                    }

                    this.swapGridData(row, col, row, col + 1);
                    const matches = this.findMatches();
                    if (matches.length > 0) {
                        const score = this.scoreMatches(matches);
                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = [{ row, col }, { row, col: col + 1 }];
                        }
                    }
                    this.swapGridData(row, col, row, col + 1);
                }

                // Try swap down
                if (row < rows - 1 && !stone[row + 1][col] && !chocolate[row + 1][col] &&
                    this.board.canSwapAt(row + 1, col) &&
                    !this.board.hasLicoriceWall(row, col, row + 1, col)) {
                    const c2 = candies[row + 1][col];
                    if (c1 && c2 && c1.isSpecial && c2.isSpecial && bestScore < 280) {
                        bestScore = 280;
                        bestMove = [{ row, col }, { row: row + 1, col }];
                    } else if (c1 && c2 && (c1.isSpecial || c2.isSpecial)) {
                        const special = c1.isSpecial ? c1 : c2;
                        const other = c1.isSpecial ? c2 : c1;
                        if (!(special.specialType === 'color_bomb' && other.isIngredient) && bestScore < 85) {
                            bestScore = 85;
                            bestMove = [{ row, col }, { row: row + 1, col }];
                        }
                    }

                    this.swapGridData(row, col, row + 1, col);
                    const matches = this.findMatches();
                    if (matches.length > 0) {
                        const score = this.scoreMatches(matches);
                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = [{ row, col }, { row: row + 1, col }];
                        }
                    }
                    this.swapGridData(row, col, row + 1, col);
                }
            }
        }
        return bestMove || fallbackSpecialTap;
    }

    // Score matches based on objective progress and special candy creation
    scoreMatches(matches) {
        let score = 0;
        const scene = this.board.scene;
        const objective = this.board.levelConfig?.objective || 'score';
        const collectTargets = this.board.levelConfig?.collect || {};
        const { rows, cols, chocolate, bombTimer, honey, ice, chains, jelly } = this.board;

        for (const match of matches) {
            const cellCount = match.cells.length;

            // Base score for match length (longer = better specials)
            score += cellCount * 10;

            // Bonus for special candy creation
            if (match.specialToCreate === 'color_bomb') {
                score += 200; // 5+ match = color bomb
            } else if (match.specialToCreate === 'bomb') {
                score += 150; // T/L shape = bomb
            } else if (match.specialToCreate === 'line_h' || match.specialToCreate === 'line_v') {
                score += 100; // 4 match = line clearer
            }

            // Objective-specific scoring
            for (const cell of match.cells) {
                const { row, col } = cell;

                // Jelly clearing bonus
                if (objective === 'clearJelly' || objective === 'mixed' || objective === 'ultimate') {
                    if (jelly[row][col] > 0) {
                        score += 50; // Each jelly cell cleared is valuable
                    }
                }

                // Collection bonus
                if (objective === 'collect' || objective === 'mixed' || objective === 'ultimate') {
                    const candyType = match.type;
                    if (collectTargets[candyType] !== undefined) {
                        const remaining = (scene?.objectives?.collect?.[candyType] || 0) -
                                          (scene?.status?.collect?.[candyType] || 0);
                        if (remaining > 0) {
                            score += 40; // Matches target color
                        }
                    }
                }

                // Drop objective - prioritize matches in columns with ingredients
                if (objective === 'drop' || objective === 'mixed' || objective === 'ultimate') {
                    // Check if there's an ingredient above this cell
                    for (let r = 0; r < row; r++) {
                        const candy = this.board.candies[r][col];
                        if (candy && candy.isIngredient) {
                            score += 80; // High priority - helps ingredient fall
                            break;
                        }
                    }
                    // Also favor lower matches in general
                    score += row * 2;
                }

                // Chocolate, Crate, and Locked adjacency bonus - matches next to them clear/break them
                const neighbors = [[row-1, col], [row+1, col], [row, col-1], [row, col+1]];
                for (const [nr, nc] of neighbors) {
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                        if (chocolate && chocolate[nr][nc]) {
                            score += 60; // Clearing chocolate is important
                        }
                        if (this.board.crate && this.board.crate[nr][nc] > 0) {
                            score += 50; // Breaking wooden crates
                        }
                        if (this.board.honey && this.board.honey[nr][nc]) {
                            score += 55; // Clearing honey
                        }
                        if (this.board.locked && this.board.locked[nr][nc]) {
                            score += 45; // Unlocking locked tiles
                        }
                    }
                }

                // Bomb timer urgency - prioritize moves near bomb timers with low counts
                if (bombTimer) {
                    for (let dr = -2; dr <= 2; dr++) {
                        for (let dc = -2; dc <= 2; dc++) {
                            const nr = row + dr;
                            const nc = col + dc;
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && bombTimer[nr][nc] > 0) {
                                const urgency = Math.max(0, 15 - bombTimer[nr][nc]); // More urgent as timer decreases
                                score += urgency * 10;
                            }
                        }
                    }
                }

                // Honey clearing bonus
                if (honey && honey[row][col]) {
                    score += 45; // Clearing honey stops spreading
                }

                // Ice breaking bonus
                if (ice && ice[row][col] > 0) {
                    score += 35;
                }

                // Chain breaking bonus
                if (chains && chains[row][col] > 0) {
                    score += 30;
                }
            }
        }

        return score;
    }

    swapGridData(r1, c1, r2, c2) {
        const temp = this.board.grid[r1][c1];
        this.board.grid[r1][c1] = this.board.grid[r2][c2];
        this.board.grid[r2][c2] = temp;
    }
}
