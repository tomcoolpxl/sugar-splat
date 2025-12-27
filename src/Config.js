export const GameConfig = {
    // Board Settings
    BOARD: {
        ROWS: 8,
        COLS: 8,
        PADDING: 15,
        ANIMATION_SPEED: {
            SWAP: 150,
            FALL: 200,
            DESTROY: 200,
            GRAVITY_BASE: 150,
            GRAVITY_PER_ROW: 50,
            FILL_BASE: 300,
            FILL_PER_ROW: 50,
            SPECIAL_ACTIVATION: 300,
            EXPLOSION: 400,
            CROSS_EFFECT: 400,
            SHUFFLE_SCALE: 200,
            JELLY_CLEAR: 200,
            LOCK_BREAK: 300,
            LANDING_SQUASH: 100
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
    },

    // Audio Configuration
    AUDIO: {
        MASTER_VOLUME: 0.3,
        MUSIC_VOLUME_MULTIPLIER: 0.4,

        // Music Settings
        MUSIC: {
            TEMPO: 110,
            CHORD_PROGRESSION: [
                { root: 130.81, name: 'Cm' },  // C3
                { root: 103.83, name: 'Ab' },  // Ab2
                { root: 155.56, name: 'Eb' },  // Eb3
                { root: 116.54, name: 'Bb' }   // Bb2
            ],
            PENTATONIC_SCALE: [1, 1.2, 1.33, 1.5, 1.78]
        },

        // Sound Effect Definitions
        SOUNDS: {
            // UI / Interaction
            select: {
                type: 'sine',
                freqStart: 880,
                freqEnd: 1200,
                duration: 0.05,
                attack: 0.01,
                decay: 0.04
            },
            click: {
                type: 'square',
                freqStart: 400,
                freqEnd: 600,
                duration: 0.05,
                vol: 0.1
            },

            // Gameplay - Basic
            swap: {
                type: 'triangle',
                freqStart: 300,
                freqEnd: 600,
                duration: 0.15,
                slide: true
            },
            invalid: {
                type: 'sawtooth',
                freqStart: 150,
                freqEnd: 80,
                duration: 0.2,
                vol: 0.15
            },
            match: {
                type: 'sine',
                freqStart: 523.25,  // C5
                freqEnd: 1046.50,   // C6
                duration: 0.15,
                vol: 0.25
            },
            cascade: {
                type: 'sine',
                freqStart: 1046.50, // C6
                freqEnd: 2093.00,   // C7
                duration: 0.2,
                vol: 0.25
            },

            // Gameplay - Specials
            bomb: {
                type: 'noise',
                duration: 0.4,
                vol: 0.4
            },
            line: {
                type: 'sawtooth',
                freqStart: 800,
                freqEnd: 200,
                duration: 0.3,
                vol: 0.15,
                slide: true
            },

            // Jingles (Sequences)
            win: {
                type: 'sequence',
                instrument: 'triangle',
                notes: [
                    { freq: 523.25, dur: 0.1, time: 0 },    // C5
                    { freq: 659.25, dur: 0.1, time: 0.1 },  // E5
                    { freq: 783.99, dur: 0.1, time: 0.2 },  // G5
                    { freq: 1046.50, dur: 0.4, time: 0.3 }  // C6
                ],
                vol: 0.2
            },
            levelFail: {
                type: 'sequence',
                instrument: 'sawtooth',
                notes: [
                    { freq: 392.00, dur: 0.2, time: 0 },    // G4
                    { freq: 311.13, dur: 0.2, time: 0.2 },  // Eb4
                    { freq: 261.63, dur: 0.6, time: 0.4 }   // C4
                ],
                vol: 0.15
            }
        },

        // Drum sounds timing
        DRUMS: {
            KICK_DURATION: 0.15,
            KICK_FREQ_START: 150,
            KICK_VOLUME: 0.4,
            SNARE_DURATION: 0.1,
            SNARE_VOLUME: 0.2,
            HAT_DURATION: 0.05,
            HAT_VOLUME: 0.1,
            HAT_HIGHPASS_FREQ: 5000
        }
    }
};
