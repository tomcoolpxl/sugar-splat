export const GameConfig = {
    // Board Settings
    BOARD: {
        ROWS: 8,
        COLS: 8,
        PADDING: 15,
        ANIMATION_SPEED: {
            SWAP: 150,
            FALL: 200,
            DESTROY: 200
        }
    },

    // Candy Colors (Palette)
    COLORS: [
        0xff4757, // Red
        0x3742fa, // Blue
        0x2ed573, // Green
        0xffa502, // Yellow/Orange
        0xa55eea, // Purple
        0xff7f50  // Orange/Coral
    ],

    // UI Colors
    UI: {
        BACKGROUND_GRADIENT_START: { r: 255, g: 182, b: 193 },
        BACKGROUND_GRADIENT_END: { r: 173, g: 216, b: 230 },
        SCORE_TEXT: '#ffffff',
        OBJECTIVE_TEXT_SCORE: '#ffeb3b',
        OBJECTIVE_TEXT_JELLY: '#ff69b4',
        PROGRESS_BAR_BG: 0x000000,
        PROGRESS_BAR_FILL_SCORE: 0x4ade80,
        PROGRESS_BAR_FILL_JELLY: 0xff69b4
    },

    // Special Tile Visuals
    SPECIALS: {
        LINE_STRIPE_COLOR: 0xffffff,
        BOMB_GLOW_COLOR: 0xffffff,
        JELLY_SINGLE_COLOR: 0xff69b4,
        JELLY_DOUBLE_COLOR: 0xff1493,
        LOCK_COLOR: 0x87ceeb
    }
};
