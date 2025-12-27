export default class MatchLogic {
    constructor(board) {
        this.board = board;
    }

    findMatches() {
        const matches = [];
        const { rows, cols, grid, locked } = this.board;

        // 1. Horizontal Matches
        for (let row = 0; row < rows; row++) {
            let col = 0;
            while (col < cols) {
                const type = grid[row][col];
                if (type === -1 || locked[row][col] || type >= 100) {
                    col++;
                    continue;
                }

                let matchLength = 1;
                while (col + matchLength < cols &&
                       grid[row][col + matchLength] === type &&
                       !locked[row][col + matchLength]) {
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
                const type = grid[row][col];
                if (type === -1 || locked[row][col] || type >= 100) {
                    row++;
                    continue;
                }

                let matchLength = 1;
                while (row + matchLength < rows &&
                       grid[row + matchLength][col] === type &&
                       !locked[row + matchLength][col]) {
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

        if (match.length === 4) {
            result.specialToCreate = match.direction === 'horizontal' ? 'line_h' : 'line_v';
            result.specialPosition = match.cells[Math.floor(match.length / 2)];
        } else if (match.length >= 5) {
            result.specialToCreate = 'color_bomb';
            result.specialPosition = match.cells[Math.floor(match.length / 2)];
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

        return {
            type: intersection.type,
            cells: allCells,
            specialToCreate: 'bomb',
            specialPosition: intersection.intersectCell
        };
    }

    hasValidMoves() {
        const { rows, cols, grid, candies, locked } = this.board;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (locked[row][col]) continue;

                const candy = candies[row][col];
                if (candy && candy.isSpecial) return true; // Specials can always be tapped

                // Try swap right
                if (col < cols - 1 && !locked[row][col + 1]) {
                    this.swapGridData(row, col, row, col + 1);
                    if (this.findMatches().length > 0) {
                        this.swapGridData(row, col, row, col + 1);
                        return true;
                    }
                    this.swapGridData(row, col, row, col + 1);
                }

                // Try swap down
                if (row < rows - 1 && !locked[row + 1][col]) {
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
        const { rows, cols, locked } = this.board;
        let bestMove = null;
        let bestScore = -1;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (locked[row][col]) continue;

                // Try swap right
                if (col < cols - 1 && !locked[row][col + 1]) {
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
                if (row < rows - 1 && !locked[row + 1][col]) {
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
        return bestMove;
    }

    // Score matches based on objective progress and special candy creation
    scoreMatches(matches) {
        let score = 0;
        const scene = this.board.scene;
        const objective = this.board.levelConfig?.objective || 'score';
        const collectTargets = this.board.levelConfig?.collect || {};

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
                // Jelly clearing bonus
                if (objective === 'clearJelly' || objective === 'mixed' || objective === 'ultimate') {
                    if (this.board.jelly[cell.row][cell.col] > 0) {
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

                // Drop objective - prioritize lower row matches
                if (objective === 'drop' || objective === 'mixed' || objective === 'ultimate') {
                    // Matches in lower rows help ingredients fall
                    score += cell.row * 2;
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
