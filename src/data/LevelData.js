export const LevelData = {
    // === WORLD 1: BASICS (Levels 1-5) ===
    // Very easy intro levels - players should win on first try
    1: {
        moves: 40,
        objective: 'score',
        targetScore: 500,
        rows: 8, cols: 8,
        candyTypes: 4,  // Easy - only 4 colors
        tutorial: {
            title: 'Welcome!',
            text: 'Swap candies to match 3 or more.\nReach the target score to win!',
            icon: '🍬'
        }
    },
    2: {
        moves: 40,
        objective: 'score',
        targetScore: 800,
        rows: 8, cols: 8,
        candyTypes: 4
    },
    3: {
        moves: 40,
        objective: 'score',
        targetScore: 1000,
        rows: 8, cols: 8,
        candyTypes: 4  // Keep 4 colors for now
    },
    4: {
        moves: 45,
        objective: 'score',
        targetScore: 1200,
        rows: 8, cols: 8,
        candyTypes: 5,  // Introduce 5th color
        // Just 2 decorative locked tiles
        locked: [
            { row: 3, col: 3 }, { row: 3, col: 4 }
        ]
    },
    5: {
        moves: 45,
        objective: 'score',
        targetScore: 1500,
        rows: 8, cols: 8,
        candyTypes: 5,
        // Corner locks - don't affect gameplay much
        locked: [
            { row: 0, col: 0 }, { row: 0, col: 7 },
            { row: 7, col: 0 }, { row: 7, col: 7 }
        ]
    },

    // === WORLD 2: JELLY INTRO (Levels 6-10) ===
    // Gentle intro to jelly mechanics
    6: {
        moves: 45,
        objective: 'clearJelly',
        rows: 8, cols: 8,
        candyTypes: 4,  // Keep it easy for jelly intro
        // Just 4 jelly tiles in center - very easy
        jelly: [
            { row: 3, col: 3 }, { row: 3, col: 4 },
            { row: 4, col: 3 }, { row: 4, col: 4 }
        ],
        tutorial: {
            title: 'New: Jelly Tiles!',
            text: 'Match candies on pink tiles\nto clear the jelly!',
            icon: '🍮'
        }
    },
    7: {
        moves: 45,
        objective: 'clearJelly',
        rows: 8, cols: 8,
        candyTypes: 4,  // Keep 4 colors
        // 6 jelly tiles in a small pattern
        jelly: [
            { row: 3, col: 3 }, { row: 3, col: 4 },
            { row: 4, col: 3 }, { row: 4, col: 4 },
            { row: 3, col: 5 }, { row: 4, col: 5 }
        ]
    },
    8: {
        moves: 50,
        objective: 'clearJelly',
        rows: 8, cols: 8,
        candyTypes: 5,
        // 8 jelly tiles - cross pattern
        jelly: [
            { row: 3, col: 3 }, { row: 3, col: 4 },
            { row: 4, col: 3 }, { row: 4, col: 4 },
            { row: 2, col: 3 }, { row: 2, col: 4 },
            { row: 5, col: 3 }, { row: 5, col: 4 }
        ]
    },
    9: {
        moves: 50,
        objective: 'clearJelly',
        rows: 8, cols: 8,
        candyTypes: 5,
        // 4 corner jellies - spread out for variety
        jelly: [
            { row: 2, col: 2 }, { row: 2, col: 5 },
            { row: 5, col: 2 }, { row: 5, col: 5 }
        ]
    },
    10: {
        moves: 50,
        objective: 'clearJelly',
        rows: 8, cols: 8,
        candyTypes: 5,
        // Double layer intro - only 2 double-layer tiles
        jelly: [
            { row: 3, col: 3, layers: 2 }, { row: 3, col: 4, layers: 2 },
            { row: 4, col: 3 }, { row: 4, col: 4 }
        ]
    },

    // === WORLD 3: NEW MECHANICS (Levels 11-15) ===
    // Introduce new objective types gently
    11: {
        moves: 50,
        objective: 'drop',
        drop: 2,  // Just 2 ingredients
        rows: 8, cols: 8,
        candyTypes: 4,  // Easier with 4 colors
        tutorial: {
            title: 'New: Ingredients!',
            text: 'Drop the cherries 🍒 to the\nbottom of the board!',
            icon: '🍒'
        }
    },
    12: {
        moves: 50,
        objective: 'collect',
        collect: { 0: 15, 1: 15 },  // Red and Blue - very achievable
        rows: 8, cols: 8,
        candyTypes: 5,
        tutorial: {
            title: 'New: Collection!',
            text: 'Match specific colors to\nreach the target!',
            icon: '🔴🔵'
        }
    },
    13: {
        moves: 50,
        objective: 'clearJelly',
        rows: 8, cols: 8,
        candyTypes: 5,
        // 8 jelly tiles in a compact ring
        jelly: [
            { row: 2, col: 3 }, { row: 2, col: 4 },
            { row: 3, col: 2 }, { row: 3, col: 5 },
            { row: 4, col: 2 }, { row: 4, col: 5 },
            { row: 5, col: 3 }, { row: 5, col: 4 }
        ]
    },
    14: {
        moves: 55,
        objective: 'drop',
        drop: 3,
        rows: 8, cols: 8,
        candyTypes: 5,
        // Just one locked tile in the way
        locked: [
            { row: 4, col: 3 }
        ]
    },
    15: {
        moves: 55,
        objective: 'collect',
        collect: { 2: 18, 3: 18 },  // Green and Yellow
        rows: 8, cols: 8,
        candyTypes: 5
        // No jelly - pure collection level
    },

    // === WORLD 4: CHALLENGE (Levels 16-20) ===
    // Slightly harder but still very beatable
    16: {
        moves: 55,
        objective: 'score',
        targetScore: 3000,
        rows: 8, cols: 8,
        candyTypes: 5,  // Still 5 colors
        locked: [
            { row: 3, col: 3 }, { row: 3, col: 4 }
        ]
    },
    17: {
        moves: 55,
        objective: 'clearJelly',
        rows: 8, cols: 8,
        candyTypes: 5,
        // 8 jelly tiles, 4 with double layers
        jelly: [
            { row: 2, col: 3, layers: 2 }, { row: 2, col: 4, layers: 2 },
            { row: 3, col: 3 }, { row: 3, col: 4 },
            { row: 4, col: 3 }, { row: 4, col: 4 },
            { row: 5, col: 3, layers: 2 }, { row: 5, col: 4, layers: 2 }
        ]
    },
    18: {
        moves: 60,
        objective: 'mixed',
        drop: 2,  // Just 2 ingredients
        jelly: [
            { row: 6, col: 3 }, { row: 6, col: 4 },
            { row: 7, col: 3 }, { row: 7, col: 4 }
        ],
        rows: 8, cols: 8,
        candyTypes: 5
    },
    19: {
        moves: 60,
        objective: 'mixed',
        collect: { 4: 20 },  // Purple - reduced
        jelly: [
            { row: 2, col: 2 }, { row: 2, col: 5 },
            { row: 5, col: 2 }, { row: 5, col: 5 }
        ],
        rows: 8, cols: 8,
        candyTypes: 5
    },
    20: {
        moves: 70,
        objective: 'ultimate',
        targetScore: 5000,  // Reduced
        jelly: [
            { row: 3, col: 3, layers: 2 }, { row: 3, col: 4, layers: 2 },
            { row: 4, col: 3, layers: 2 }, { row: 4, col: 4, layers: 2 }
        ],
        drop: 2,
        collect: { 0: 15, 1: 15 },  // Reduced
        rows: 8, cols: 8,
        candyTypes: 5  // Keep 5 colors even for final level
    }
};
