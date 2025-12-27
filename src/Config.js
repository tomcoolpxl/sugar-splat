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

    // Powerup System
    POWERUPS: {
        hammer: {
            name: 'Hammer',
            icon: '🔨',
            description: 'Destroy any single tile',
            weight: 40  // Drop weight for rewards
        },
        bomb: {
            name: 'Bomb',
            icon: '💣',
            description: 'Explode a 3x3 area',
            weight: 30
        },
        rowcol: {
            name: 'Lightning',
            icon: '⚡',
            description: 'Clear entire row or column',
            weight: 20
        },
        colorblast: {
            name: 'Rainbow',
            icon: '🌈',
            description: 'Remove all of one color',
            weight: 10
        }
    },

    // Audio Configuration
    AUDIO: {
        MASTER_VOLUME: 0.3,
        MUSIC_VOLUME_MULTIPLIER: 0.4,

        // Music Settings - Happy C Major Chiptune (no percussion)
        // Structure: A-B-C-A with arpeggio variations
        MUSIC: {
            TEMPO: 80, // Gentle tempo for puzzle game

            // C Major chord progression: I - vi - IV - V (happy, classic)
            // Each chord has multiple arpeggio patterns for variation
            CHORDS: [
                {
                    bass: 130.81,  // C2
                    arp: [261.63, 329.63, 392.00],       // C-E-G (up)
                    arp_alt: [392.00, 329.63, 261.63],   // G-E-C (down)
                    arp_bounce: [261.63, 392.00, 329.63] // C-G-E (bounce)
                },
                {
                    bass: 110.00,  // A2
                    arp: [261.63, 329.63, 440.00],       // C-E-A (up)
                    arp_alt: [440.00, 329.63, 261.63],   // A-E-C (down)
                    arp_bounce: [261.63, 440.00, 329.63] // C-A-E (bounce)
                },
                {
                    bass: 174.61,  // F2
                    arp: [261.63, 349.23, 440.00],       // C-F-A (up)
                    arp_alt: [440.00, 349.23, 261.63],   // A-F-C (down)
                    arp_bounce: [261.63, 440.00, 349.23] // C-A-F (bounce)
                },
                {
                    bass: 196.00,  // G2
                    arp: [293.66, 392.00, 493.88],       // D-G-B (up)
                    arp_alt: [493.88, 392.00, 293.66],   // B-G-D (down)
                    arp_bounce: [293.66, 493.88, 392.00] // D-B-G (bounce)
                }
            ],

            // Section A - Main melody (bright, ascending feel)
            MELODY_A: [
                523.25, 659.25, 783.99, 659.25,  // C5 E5 G5 E5
                587.33, 783.99, 880.00, 783.99,  // D5 G5 A5 G5
                523.25, 880.00, 783.99, 659.25,  // C5 A5 G5 E5
                659.25, 587.33, 523.25, -1       // E5 D5 C5 rest
            ],

            // Section B - Variation (descending, call-and-response)
            MELODY_B: [
                783.99, 659.25, 523.25, -1,      // G5 E5 C5 rest
                880.00, 783.99, 659.25, 587.33,  // A5 G5 E5 D5
                523.25, 587.33, 659.25, 783.99,  // C5 D5 E5 G5 (ascending answer)
                880.00, 783.99, 659.25, 523.25   // A5 G5 E5 C5 (resolve down)
            ],

            // Section C - New variation (playful, skippy rhythm)
            MELODY_C: [
                659.25, -1, 783.99, 659.25,      // E5 rest G5 E5
                523.25, 659.25, 587.33, -1,      // C5 E5 D5 rest
                783.99, 880.00, 783.99, 659.25,  // G5 A5 G5 E5
                587.33, 523.25, -1, -1           // D5 C5 rest rest (breathing room)
            ],

            // Section D - Gentle resolution (calm, floaty)
            // Note: Keep all melody notes in C5+ range to avoid clashing with arpeggios (C4-B4 range)
            MELODY_D: [
                523.25, -1, 659.25, -1,          // C5 rest E5 rest (spacious)
                783.99, -1, 659.25, 523.25,      // G5 rest E5 C5
                587.33, 659.25, 523.25, -1,      // D5 E5 C5 rest
                783.99, 523.25, -1, -1           // G5 C5 rest rest (resolve with fifth)
            ],

            // Structure: A-B-C-A-D-A (theme, variation, playful, theme, calm, theme)
            SECTIONS: ['A', 'B', 'C', 'A', 'D', 'A'],
            MEASURES_PER_SECTION: 4  // Each section plays for 4 chord cycles
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
        }
    }
};
