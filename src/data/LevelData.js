export const LevelData = {
    1: { 
        moves: 30, 
        objective: 'score', 
        targetScore: 1000, 
        rows: 8, cols: 8, 
        candyTypes: 4,
        tutorial: {
            title: 'Welcome!',
            text: 'Swap candies to match 3 or more.\nReach the target score to win!',
            icon: '🍬'
        }
    },
    2: { 
        moves: 25, 
        objective: 'score', 
        targetScore: 2000, 
        rows: 8, cols: 8, 
        candyTypes: 5 
    },
    3: { 
        moves: 25, 
        objective: 'score', 
        targetScore: 3000, 
        rows: 8, cols: 8, 
        candyTypes: 5,
        locked: [
            { row: 3, col: 3 }, { row: 3, col: 4 },
            { row: 4, col: 3 }, { row: 4, col: 4 }
        ]
    },
    4: { 
        moves: 30, 
        objective: 'score', 
        targetScore: 5000, 
        rows: 8, cols: 8, 
        candyTypes: 6 
    },
    5: { 
        moves: 20, 
        objective: 'score', 
        targetScore: 4000, 
        rows: 8, cols: 8, 
        candyTypes: 5,
        locked: [
            { row: 0, col: 0 }, { row: 0, col: 7 },
            { row: 7, col: 0 }, { row: 7, col: 7 }
        ]
    },
    6: {
        moves: 30,
        objective: 'clearJelly',
        rows: 8, cols: 8, candyTypes: 5,
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
        moves: 35,
        objective: 'clearJelly',
        rows: 8, cols: 8, candyTypes: 5,
        jelly: [
            { row: 2, col: 2 }, { row: 2, col: 5 },
            { row: 5, col: 2 }, { row: 5, col: 5 },
            { row: 3, col: 3 }, { row: 3, col: 4 },
            { row: 4, col: 3 }, { row: 4, col: 4 }
        ]
    },
    8: {
        moves: 30,
        objective: 'clearJelly',
        rows: 8, cols: 8, candyTypes: 6,
        jelly: [
            { row: 0, col: 3 }, { row: 0, col: 4 },
            { row: 7, col: 3 }, { row: 7, col: 4 },
            { row: 3, col: 0 }, { row: 4, col: 0 },
            { row: 3, col: 7 }, { row: 4, col: 7 }
        ],
        locked: [
            { row: 3, col: 3 }, { row: 3, col: 4 },
            { row: 4, col: 3 }, { row: 4, col: 4 }
        ]
    },
    9: {
        moves: 40,
        objective: 'clearJelly',
        rows: 8, cols: 8, candyTypes: 6,
        jelly: [
            { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 5 }, { row: 1, col: 6 },
            { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 5 }, { row: 2, col: 6 },
            { row: 5, col: 1 }, { row: 5, col: 2 }, { row: 5, col: 5 }, { row: 5, col: 6 },
            { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 5 }, { row: 6, col: 6 }
        ]
    },
    10: {
        moves: 35,
        objective: 'clearJelly',
        rows: 8, cols: 8, candyTypes: 6,
        jelly: [
            { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 }, { row: 3, col: 6 },
            { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 4, col: 5 }, { row: 4, col: 6 }
        ],
        locked: [
            { row: 3, col: 0 }, { row: 3, col: 7 },
            { row: 4, col: 0 }, { row: 4, col: 7 }
        ]
    },
    11: {
        moves: 35,
        objective: 'drop',
        drop: 2,
        rows: 8, cols: 8, candyTypes: 5,
        tutorial: {
            title: 'New: Ingredients!',
            text: 'Drop the cherries 🍒 to the\nbottom of the board to collect them!',
            icon: '🍒'
        }
    },
    12: {
        moves: 30,
        objective: 'collect',
        collect: { 0: 30, 1: 30 }, // Red and Blue
        rows: 8, cols: 8, candyTypes: 5,
        tutorial: {
            title: 'New: Collection!',
            text: 'Match specific colors to\nfill the collection targets!',
            icon: '🔴🔵'
        }
    },
    13: {
        moves: 40,
        objective: 'mixed',
        collect: { 4: 40 }, // Purple
        drop: 2,
        rows: 8, cols: 8, candyTypes: 6,
        jelly: [
            { row: 3, col: 0 }, { row: 3, col: 7 },
            { row: 4, col: 0 }, { row: 4, col: 7 }
        ]
    },
    14: {
        moves: 35,
        objective: 'mixed',
        jelly: [
            { row: 3, col: 3, layers: 2 }, { row: 3, col: 4, layers: 2 },
            { row: 4, col: 3, layers: 2 }, { row: 4, col: 4, layers: 2 }
        ],
        drop: 3,
        rows: 8, cols: 8, candyTypes: 6
    },
    15: {
        moves: 45,
        objective: 'mixed',
        collect: { 2: 50, 5: 50 }, // Green and Orange
        jelly: [
            { row: 0, col: 0 }, { row: 0, col: 7 },
            { row: 7, col: 0 }, { row: 7, col: 7 }
        ],
        rows: 8, cols: 8, candyTypes: 6
    },
    16: {
        moves: 35,
        objective: 'score',
        targetScore: 15000,
        rows: 8, cols: 8, candyTypes: 6,
        locked: [
            { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
            { row: 5, col: 2 }, { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 }
        ]
    },
    17: {
        moves: 45,
        objective: 'mixed',
        jelly: [
            { row: 2, col: 2, layers: 2 }, { row: 2, col: 5, layers: 2 },
            { row: 5, col: 2, layers: 2 }, { row: 5, col: 5, layers: 2 }
        ],
        drop: 4,
        rows: 8, cols: 8, candyTypes: 6
    },
    18: {
        moves: 40,
        objective: 'collect',
        collect: { 0: 40, 1: 40, 2: 40 },
        rows: 8, cols: 8, candyTypes: 6,
        jelly: [
            { row: 0, col: 0, layers: 2 }, { row: 0, col: 7, layers: 2 },
            { row: 7, col: 0, layers: 2 }, { row: 7, col: 7, layers: 2 }
        ]
    },
    19: {
        moves: 50,
        objective: 'mixed',
        drop: 5,
        collect: { 3: 60 },
        rows: 8, cols: 8, candyTypes: 6,
        locked: [
            { row: 3, col: 3 }, { row: 3, col: 4 },
            { row: 4, col: 3 }, { row: 4, col: 4 }
        ]
    },
    20: {
        moves: 60,
        objective: 'ultimate',
        targetScore: 25000,
        jelly: [
            { row: 0, col: 0, layers: 2 }, { row: 0, col: 7, layers: 2 },
            { row: 7, col: 0, layers: 2 }, { row: 7, col: 7, layers: 2 }
        ],
        drop: 3,
        collect: { 4: 50, 5: 50 },
        rows: 8, cols: 8, candyTypes: 6,
        locked: [
            { row: 3, col: 0 }, { row: 3, col: 7 },
            { row: 4, col: 0 }, { row: 4, col: 7 }
        ]
    }
};
