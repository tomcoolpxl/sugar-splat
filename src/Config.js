export const GameConfig = {
    // Particle settings
    PARTICLES: {
        CANDY_COUNT: 20,
        JELLY_COUNT: 30,
        SPECIAL_COUNT: 45,
        COLOR_BOMB_COUNT: 80,
        ICE_COUNT: 25,
        CHAIN_COUNT: 20,
        CHOCOLATE_COUNT: 30,
        CRATE_COUNT: 28,
        BOMB_TIMER_COUNT: 40,
        PORTAL_COUNT: 35
    },

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
        0xff4757, // Red (Circle)
        0x3742fa, // Blue (Rounded Square)
        0x2ed573, // Green (Diamond)
        0xffd32a, // Sunny Golden Yellow (Star)
        0xa55eea, // Purple (Triangle)
        0xff6348  // Vivid Coral-Orange (Hexagon)
    ],

    // UI Colors & Typography
    UI: {
        FONT_FAMILY: "'Fredoka', 'Arial Black', Arial, sans-serif",
        FONT_FAMILY_BODY: "'Fredoka', Arial, sans-serif",
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

    // Blocker Visuals
    BLOCKERS: {
        // Ice - frozen candy overlay
        ICE_SINGLE_COLOR: 0x87CEEB,
        ICE_DOUBLE_COLOR: 0x4FC3F7,
        ICE_HIGHLIGHT: 0xFFFFFF,
        ICE_SINGLE_ALPHA: 0.5,
        ICE_DOUBLE_ALPHA: 0.7,
        ICE_BORDER_SINGLE: 2,
        ICE_BORDER_DOUBLE: 3,
        ICE_PADDING: 4,
        ICE_CORNER_RADIUS: 8,
        ICE_SPARKLE_RADIUS: [3, 2, 2],

        // Chains - metal links
        CHAIN_COLOR: 0x9E9E9E,
        CHAIN_HIGHLIGHT: 0xBDBDBD,
        CHAIN_LINK_SIZE: 8,
        CHAIN_SINGLE_WIDTH: 3,
        CHAIN_DOUBLE_WIDTH: 4,
        CHAIN_OFFSET_RATIO: 0.5,  // Offset from center as ratio of cellSize/2

        // Stone - indestructible obstacle
        STONE_COLOR: 0x757575,
        STONE_CRACK_COLOR: 0x424242,
        STONE_HIGHLIGHT: 0x9E9E9E,
        STONE_PADDING: 4,
        STONE_CORNER_RADIUS: 6,
        STONE_CRACK_WIDTH: 2,
        STONE_HIGHLIGHT_WIDTH: 2,

        // Honey - spreading hazard
        HONEY_COLOR: 0xFFB300,
        HONEY_DRIP_COLOR: 0xFFC107,
        HONEY_HIGHLIGHT: 0xFFE082,
        HONEY_ALPHA: 0.75,
        HONEY_PADDING: 6,
        HONEY_CORNER_RADIUS: 12,
        HONEY_DRIP_RADII: [8, 6, 5],
        HONEY_HIGHLIGHT_RADII: [6, 3],
        HONEY_SPREAD_INTERVAL: 2,        // Spread every N moves (1 = every move)
        HONEY_SPREAD_CHANCE: 0.5,         // Chance each honey tile spreads (0-1)
        HONEY_COVERAGE_LOSE_THRESHOLD: 0.85,

        // Licorice - wall barrier
        LICORICE_COLOR: 0x212121,
        LICORICE_HIGHLIGHT: 0x424242,
        LICORICE_THICKNESS: 8,
        LICORICE_HIGHLIGHT_WIDTH: 2,

        // Animation durations
        CLEAR_DURATION: 200,
        SHIMMER_DURATION: 1500,
        CHAIN_RATTLE_DURATION: 100,
        CHAIN_RATTLE_DELAY: 2000,
        HONEY_DRIP_DURATION: 800,

        // Chocolate - spreader blocker, blocks cell, cleared by adjacent match
        CHOCOLATE_COLOR: 0x5D4037,
        CHOCOLATE_DARK: 0x3E2723,
        CHOCOLATE_HIGHLIGHT: 0x8D6E63,
        CHOCOLATE_SWIRL_COLOR: 0x4E342E,
        CHOCOLATE_ALPHA: 0.95,
        CHOCOLATE_PADDING: 2,
        CHOCOLATE_CORNER_RADIUS: 10,
        CHOCOLATE_SPREAD_INTERVAL: 2,     // Spreads every 2 moves
        CHOCOLATE_SPREAD_CHANCE: 0.35,    // 35% chance each tile spreads
        CHOCOLATE_COVERAGE_LOSE_THRESHOLD: 0.75,

        // Crate - wooden box around candy (1-3 layers)
        CRATE_COLOR: 0xD7A86E,
        CRATE_DARK: 0xA67C52,
        CRATE_HIGHLIGHT: 0xE8C07D,
        CRATE_NAIL_COLOR: 0x757575,
        CRATE_PADDING: 3,
        CRATE_CORNER_RADIUS: 4,
        CRATE_PLANK_WIDTH: 3,

        // Bomb Timer - countdown candy that must be cleared
        BOMB_TIMER_BG_COLOR: 0x1A1A1A,
        BOMB_TIMER_FUSE_COLOR: 0xFF5722,
        BOMB_TIMER_WARNING_COLOR: 0xFF0000,
        BOMB_TIMER_TEXT_COLOR: 0xFFFFFF,
        BOMB_TIMER_DANGER_THRESHOLD: 3,   // Flash red when <= 3 moves
        BOMB_TIMER_PULSE_DURATION: 300,

        // Conveyor Belt - moves candies in direction
        CONVEYOR_COLOR: 0x607D8B,
        CONVEYOR_STRIPE_COLOR: 0x455A64,
        CONVEYOR_ARROW_COLOR: 0xFFEB3B,
        CONVEYOR_PADDING: 2,
        CONVEYOR_ANIMATION_SPEED: 1000,

        // Portal - paired teleporters
        PORTAL_ENTRANCE_COLOR: 0x7C4DFF,
        PORTAL_EXIT_COLOR: 0x00E676,
        PORTAL_RING_COLOR: 0xFFFFFF,
        PORTAL_GLOW_ALPHA: 0.6,
        PORTAL_SIZE_RATIO: 0.7,
        PORTAL_SPIN_DURATION: 2000
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
            MEASURES_PER_SECTION: 4,  // Each section plays for 4 chord cycles

            // Sound palettes for different levels - defines instrument timbres
            // Each palette creates a distinct mood while using the same melodies
            PALETTES: {
                // Soft & Gentle - early levels (sine-heavy, mellow muffled feel)
                gentle: {
                    bass: { type: 'sine', vol: 0.9, attack: 0.03, release: 0.03 },
                    arp: { type: 'triangle', vol: 0.35, attack: 0.02, release: 0.02 },
                    melody: { type: 'triangle', vol: 0.7, attack: 0.03, release: 0.03 }
                },
                // Muffled - warm, cozy, pure mellow sine tones with cushioned envelope and warm lowpass filtering
                muffled: {
                    bass: { type: 'sine', vol: 0.95, attack: 0.04, release: 0.04, lowpass: 600 },
                    arp: { type: 'sine', vol: 0.35, attack: 0.03, release: 0.03, lowpass: 800 },
                    melody: { type: 'sine', vol: 0.65, attack: 0.04, release: 0.04, lowpass: 900 }
                },
                // Classic Chiptune - bright and crisp
                chiptune: {
                    bass: { type: 'triangle', vol: 0.8, attack: 0.005, release: 0.01 },
                    arp: { type: 'square', vol: 0.3, attack: 0.005, release: 0.01 },
                    melody: { type: 'square', vol: 0.6, attack: 0.005, release: 0.01 }
                },
                // Warm & Rich - fuller sound with sawtooth (the Level 51 favorite lead!)
                warm: {
                    bass: { type: 'triangle', vol: 0.85, attack: 0.01, release: 0.02 },
                    arp: { type: 'triangle', vol: 0.25, attack: 0.01, release: 0.02 },
                    melody: { type: 'sawtooth', vol: 0.45, attack: 0.01, release: 0.02 }
                },
                // Dreamy - soft sine tones with airy triangle melody
                dreamy: {
                    bass: { type: 'sine', vol: 0.7, attack: 0.03, release: 0.04 },
                    arp: { type: 'sine', vol: 0.4, attack: 0.02, release: 0.03 },
                    melody: { type: 'triangle', vol: 0.65, attack: 0.03, release: 0.04 }
                },
                // Punchy - more aggressive, game-like
                punchy: {
                    bass: { type: 'sawtooth', vol: 0.6, attack: 0.003, release: 0.01 },
                    arp: { type: 'square', vol: 0.25, attack: 0.003, release: 0.01 },
                    melody: { type: 'square', vol: 0.55, attack: 0.003, release: 0.01 }
                },
                // Crystal - bright and shimmery
                crystal: {
                    bass: { type: 'triangle', vol: 0.75, attack: 0.01, release: 0.02 },
                    arp: { type: 'sine', vol: 0.45, attack: 0.01, release: 0.01 },
                    melody: { type: 'sine', vol: 0.8, attack: 0.005, release: 0.01 }
                }
            },

            // Level to palette mapping - defines sound envelope / timbre per level
            // Each level plays its world's song with a distinct sound envelope (intro, muffled, dreamy, crystal, punchy boss)
            // Ensures every consecutive level sounds completely different!
            LEVEL_PALETTES: {
                // World 1: Sweet Meadows (Levels 1-5)
                1: 'gentle',      // Mellow sine & triangle intro
                2: 'muffled',     // Cozy pure sine with lowpass
                3: 'dreamy',      // Floating airy sine/triangle
                4: 'crystal',     // Sparkling crystalline
                5: 'punchy',      // Energetic boss climax
                // World 2: Frosty Peaks (Levels 6-10)
                6: 'warm',        // Chilly A Minor theme intro
                7: 'muffled',     // Muffled pure sine
                8: 'dreamy',      // Floating airy bells
                9: 'crystal',     // Crystalline frost
                10: 'punchy',     // Boss climax (+8 BPM)
                // World 3: Gummy Gardens (Levels 11-15)
                11: 'warm',       // Bouncy G Major theme intro
                12: 'muffled',    // Muffled pure sine
                13: 'dreamy',     // Floaty
                14: 'crystal',    // Shimmer
                15: 'punchy',     // Boss climax (+8 BPM)
                // World 4: Soda Springs (Levels 16-20)
                16: 'warm',       // Upbeat bubble pop intro
                17: 'muffled',    // Muffled pure sine
                18: 'dreamy',     // Floaty
                19: 'crystal',    // Shimmer
                20: 'punchy',     // Boss climax (+8 BPM)
                // World 5: Licorice Maze (Levels 21-25)
                21: 'warm',       // Mysterious D Minor intro
                22: 'muffled',    // Muffled pure sine
                23: 'dreamy',     // Floaty
                24: 'crystal',    // Shimmer
                25: 'punchy',     // Boss climax (+8 BPM)
                // World 6: Stone Quarry (Levels 26-30)
                26: 'warm',       // Industrial pulse intro
                27: 'muffled',    // Muffled pure sine
                28: 'dreamy',     // Floaty
                29: 'crystal',    // Shimmer
                30: 'punchy',     // Boss climax (+8 BPM)
                // World 7: Cocoa Fortress (Levels 31-35)
                31: 'warm',       // Dramatic E Minor intro
                32: 'muffled',    // Muffled pure sine
                33: 'dreamy',     // Floaty
                34: 'crystal',    // Shimmer
                35: 'punchy',     // Boss climax (+8 BPM)
                // World 8: Portal Nexus (Levels 36-40)
                36: 'warm',       // Cosmic synthwave intro
                37: 'muffled',    // Muffled pure sine
                38: 'dreamy',     // Floaty
                39: 'crystal',    // Shimmer
                40: 'punchy',     // Boss climax (+8 BPM)
                // World 9: Cotton Candy Cloud (Levels 41-45)
                41: 'warm',       // Dreamy floating Eb Major intro
                42: 'muffled',    // Muffled pure sine
                43: 'dreamy',     // Floaty
                44: 'crystal',    // Shimmer
                45: 'punchy',     // Boss climax (+8 BPM)
                // World 10: Peppermint Peak (Levels 46-50)
                46: 'warm',       // Frigid Alpine B Minor intro
                47: 'muffled',    // Muffled pure sine
                48: 'dreamy',     // Floaty
                49: 'crystal',    // Shimmer
                50: 'punchy',     // Boss climax (+8 BPM)
                // World 11: Caramel Caverns (Levels 51-55)
                51: 'warm',       // Subterranean C Minor intro (Player favorite!)
                52: 'muffled',    // Muffled pure sine
                53: 'dreamy',     // Floaty
                54: 'crystal',    // Shimmer
                55: 'punchy',     // Boss climax (+8 BPM)
                // World 12: Sugar Citadel (Levels 56-60)
                56: 'warm',       // Regal Anthem intro (Player liked!)
                57: 'muffled',    // Muffled pure sine
                58: 'dreamy',     // Floaty
                59: 'crystal',    // Shimmer
                60: 'punchy'      // Grand Finale Boss (+8 BPM)
            },

            // Distinct Compositions for Worlds 1-12
            // Each world has its own key, chords, melodies, tempo, and mood!
            WORLD_THEMES: {
                // World 1: Sweet Meadows (Levels 1-5) - Cheerful C Major
                1: {
                    name: 'Sweet Meadows',
                    tempo: 84,
                    chords: [
                        { bass: 130.81, arp: [261.63, 329.63, 392.00], arp_alt: [392.00, 329.63, 261.63], arp_bounce: [261.63, 392.00, 329.63] },
                        { bass: 110.00, arp: [261.63, 329.63, 440.00], arp_alt: [440.00, 329.63, 261.63], arp_bounce: [261.63, 440.00, 329.63] },
                        { bass: 174.61, arp: [261.63, 349.23, 440.00], arp_alt: [440.00, 349.23, 261.63], arp_bounce: [261.63, 440.00, 349.23] },
                        { bass: 196.00, arp: [293.66, 392.00, 493.88], arp_alt: [493.88, 392.00, 293.66], arp_bounce: [293.66, 493.88, 392.00] }
                    ],
                    melodies: {
                        A: [523.25, 659.25, 783.99, 659.25, 587.33, 783.99, 880.00, 783.99, 523.25, 880.00, 783.99, 659.25, 659.25, 587.33, 523.25, -1],
                        B: [783.99, 659.25, 523.25, -1, 880.00, 783.99, 659.25, 587.33, 523.25, 587.33, 659.25, 783.99, 880.00, 783.99, 659.25, 523.25]
                    },
                    palette: { bass: { type: 'triangle', vol: 0.8 }, arp: { type: 'square', vol: 0.28 }, melody: { type: 'square', vol: 0.55 } }
                },
                // World 2: Frosty Peaks (Levels 6-10) - Chilly A Minor, crisp bells
                2: {
                    name: 'Frosty Peaks',
                    tempo: 76,
                    chords: [
                        { bass: 110.00, arp: [261.63, 329.63, 440.00], arp_alt: [440.00, 329.63, 261.63], arp_bounce: [261.63, 440.00, 329.63] },
                        { bass: 87.31,  arp: [261.63, 349.23, 440.00], arp_alt: [440.00, 349.23, 261.63], arp_bounce: [261.63, 440.00, 349.23] },
                        { bass: 146.83, arp: [293.66, 349.23, 440.00], arp_alt: [440.00, 349.23, 293.66], arp_bounce: [293.66, 440.00, 349.23] },
                        { bass: 164.81, arp: [246.94, 329.63, 392.00], arp_alt: [392.00, 329.63, 246.94], arp_bounce: [246.94, 392.00, 329.63] }
                    ],
                    melodies: {
                        A: [880.00, 659.25, 587.33, 659.25, 880.00, -1, 783.99, 659.25, 698.46, 587.33, 523.25, 587.33, 659.25, -1, 587.33, 440.00],
                        B: [659.25, 783.99, 880.00, 987.77, 880.00, 783.99, 659.25, -1, 698.46, 659.25, 587.33, 523.25, 440.00, -1, -1, -1]
                    },
                    palette: { bass: { type: 'sine', vol: 0.85 }, arp: { type: 'sine', vol: 0.4 }, melody: { type: 'triangle', vol: 0.7 } },
                    bossPalette: { bass: { type: 'sawtooth', vol: 0.65 }, arp: { type: 'square', vol: 0.35 }, melody: { type: 'square', vol: 0.7 } }
                },
                // World 3: Gummy Gardens (Levels 11-15) - Bouncy G Major
                3: {
                    name: 'Gummy Gardens',
                    tempo: 88,
                    chords: [
                        { bass: 196.00, arp: [293.66, 392.00, 493.88], arp_alt: [493.88, 392.00, 293.66], arp_bounce: [293.66, 493.88, 392.00] },
                        { bass: 146.83, arp: [293.66, 369.99, 440.00], arp_alt: [440.00, 369.99, 293.66], arp_bounce: [293.66, 440.00, 369.99] },
                        { bass: 164.81, arp: [246.94, 329.63, 392.00], arp_alt: [392.00, 329.63, 246.94], arp_bounce: [246.94, 392.00, 329.63] },
                        { bass: 130.81, arp: [261.63, 329.63, 392.00], arp_alt: [392.00, 329.63, 261.63], arp_bounce: [261.63, 392.00, 329.63] }
                    ],
                    melodies: {
                        A: [783.99, 739.99, 783.99, -1, 587.33, 659.25, 739.99, -1, 659.25, 587.33, 659.25, 783.99, 523.25, 659.25, 587.33, -1],
                        B: [587.33, 659.25, 783.99, 880.00, 987.77, 880.00, 783.99, -1, 659.25, 783.99, 880.00, 783.99, 587.33, -1, 783.99, -1]
                    },
                    palette: { bass: { type: 'triangle', vol: 0.8 }, arp: { type: 'square', vol: 0.28 }, melody: { type: 'square', vol: 0.6 } }
                },
                // World 4: Soda Springs (Levels 16-20) - Upbeat F Major Bubble Pop
                4: {
                    name: 'Soda Springs',
                    tempo: 94,
                    chords: [
                        { bass: 174.61, arp: [261.63, 349.23, 440.00], arp_alt: [440.00, 349.23, 261.63], arp_bounce: [261.63, 440.00, 349.23] },
                        { bass: 130.81, arp: [261.63, 329.63, 392.00], arp_alt: [392.00, 329.63, 261.63], arp_bounce: [261.63, 392.00, 329.63] },
                        { bass: 146.83, arp: [293.66, 349.23, 440.00], arp_alt: [440.00, 349.23, 293.66], arp_bounce: [293.66, 440.00, 349.23] },
                        { bass: 116.54, arp: [233.08, 293.66, 349.23], arp_alt: [349.23, 293.66, 233.08], arp_bounce: [233.08, 349.23, 293.66] }
                    ],
                    melodies: {
                        A: [698.46, 783.99, 880.00, 783.99, 659.25, -1, 523.25, 659.25, 587.33, 698.46, 587.33, -1, 466.16, 587.33, 523.25, -1],
                        B: [880.00, 698.46, 880.00, 932.33, 880.00, 783.99, 698.46, -1, 659.25, 698.46, 783.99, 659.25, 587.33, 523.25, 466.16, -1]
                    },
                    palette: { bass: { type: 'triangle', vol: 0.85 }, arp: { type: 'sawtooth', vol: 0.22 }, melody: { type: 'square', vol: 0.6 } },
                    bossPalette: { bass: { type: 'sawtooth', vol: 0.7 }, arp: { type: 'square', vol: 0.35 }, melody: { type: 'sawtooth', vol: 0.65 } }
                },
                // World 5: Licorice Maze (Levels 21-25) - Mysterious D Minor Labyrinth
                5: {
                    name: 'Licorice Maze',
                    tempo: 82,
                    chords: [
                        { bass: 146.83, arp: [293.66, 349.23, 440.00], arp_alt: [440.00, 349.23, 293.66], arp_bounce: [293.66, 440.00, 349.23] },
                        { bass: 196.00, arp: [293.66, 392.00, 493.88], arp_alt: [493.88, 392.00, 293.66], arp_bounce: [293.66, 493.88, 392.00] },
                        { bass: 146.83, arp: [293.66, 349.23, 440.00], arp_alt: [440.00, 349.23, 293.66], arp_bounce: [293.66, 440.00, 349.23] },
                        { bass: 130.81, arp: [261.63, 329.63, 392.00], arp_alt: [392.00, 329.63, 261.63], arp_bounce: [261.63, 392.00, 329.63] }
                    ],
                    melodies: {
                        A: [587.33, -1, 698.46, 587.33, 783.99, 739.99, 783.99, -1, 587.33, 698.46, 880.00, -1, 783.99, 659.25, 587.33, -1],
                        B: [880.00, 783.99, 698.46, 587.33, 659.25, 587.33, 523.25, -1, 587.33, 698.46, 783.99, 880.00, 783.99, 698.46, 587.33, -1]
                    },
                    palette: { bass: { type: 'triangle', vol: 0.85 }, arp: { type: 'square', vol: 0.3 }, melody: { type: 'sawtooth', vol: 0.45 } }
                },
                // World 6: Stone Quarry (Levels 26-30) - Industrial G Minor Pulse
                6: {
                    name: 'Stone Quarry',
                    tempo: 86,
                    chords: [
                        { bass: 98.00,  arp: [293.66, 392.00, 466.16], arp_alt: [466.16, 392.00, 293.66], arp_bounce: [293.66, 466.16, 392.00] },
                        { bass: 77.78,  arp: [311.13, 392.00, 466.16], arp_alt: [466.16, 392.00, 311.13], arp_bounce: [311.13, 466.16, 392.00] },
                        { bass: 87.31,  arp: [261.63, 349.23, 440.00], arp_alt: [440.00, 349.23, 261.63], arp_bounce: [261.63, 440.00, 349.23] },
                        { bass: 98.00,  arp: [293.66, 392.00, 466.16], arp_alt: [466.16, 392.00, 293.66], arp_bounce: [293.66, 466.16, 392.00] }
                    ],
                    melodies: {
                        A: [783.99, -1, 622.25, 587.33, 698.46, -1, 587.33, 466.16, 587.33, 622.25, 698.46, -1, 783.99, 698.46, 587.33, -1],
                        B: [466.16, 587.33, 622.25, 698.46, 783.99, -1, 698.46, -1, 622.25, 587.33, 466.16, 392.00, 466.16, 587.33, 392.00, -1]
                    },
                    palette: { bass: { type: 'sawtooth', vol: 0.65 }, arp: { type: 'square', vol: 0.3 }, melody: { type: 'square', vol: 0.55 } },
                    bossPalette: { bass: { type: 'sawtooth', vol: 0.75 }, arp: { type: 'square', vol: 0.38 }, melody: { type: 'sawtooth', vol: 0.65 } }
                },
                // World 7: Cocoa Fortress (Levels 31-35) - Dramatic E Minor Tension
                7: {
                    name: 'Cocoa Fortress',
                    tempo: 90,
                    chords: [
                        { bass: 82.41,  arp: [246.94, 329.63, 392.00], arp_alt: [392.00, 329.63, 246.94], arp_bounce: [246.94, 392.00, 329.63] },
                        { bass: 65.41,  arp: [261.63, 329.63, 392.00], arp_alt: [392.00, 329.63, 261.63], arp_bounce: [261.63, 392.00, 329.63] },
                        { bass: 98.00,  arp: [293.66, 392.00, 493.88], arp_alt: [493.88, 392.00, 293.66], arp_bounce: [293.66, 493.88, 392.00] },
                        { bass: 73.42,  arp: [293.66, 369.99, 440.00], arp_alt: [440.00, 369.99, 293.66], arp_bounce: [293.66, 440.00, 369.99] }
                    ],
                    melodies: {
                        A: [659.25, 783.99, 987.77, 880.00, 783.99, -1, 659.25, 783.99, 880.00, 783.99, 739.99, 659.25, 587.33, 659.25, 493.88, -1],
                        B: [987.77, 880.00, 783.99, 659.25, 783.99, 880.00, 987.77, -1, 880.00, 783.99, 739.99, 587.33, 659.25, -1, -1, -1]
                    },
                    palette: { bass: { type: 'triangle', vol: 0.8 }, arp: { type: 'triangle', vol: 0.35 }, melody: { type: 'sawtooth', vol: 0.5 } }
                },
                // World 8: Portal Nexus (Levels 36-40) - Cosmic Synthwave D Lydian
                8: {
                    name: 'Portal Nexus',
                    tempo: 80,
                    chords: [
                        { bass: 73.42,  arp: [293.66, 369.99, 440.00], arp_alt: [440.00, 369.99, 293.66], arp_bounce: [293.66, 440.00, 369.99] },
                        { bass: 82.41,  arp: [246.94, 329.63, 392.00], arp_alt: [392.00, 329.63, 246.94], arp_bounce: [246.94, 392.00, 329.63] },
                        { bass: 110.00, arp: [261.63, 329.63, 440.00], arp_alt: [440.00, 329.63, 261.63], arp_bounce: [261.63, 440.00, 329.63] },
                        { bass: 123.47, arp: [246.94, 369.99, 440.00], arp_alt: [440.00, 369.99, 246.94], arp_bounce: [246.94, 440.00, 369.99] }
                    ],
                    melodies: {
                        A: [739.99, 880.00, 1108.73, 987.77, 880.00, -1, 739.99, 880.00, 659.25, 739.99, 880.00, -1, 587.33, 739.99, 659.25, -1],
                        B: [1108.73, 987.77, 880.00, 739.99, 659.25, 739.99, 880.00, -1, 739.99, 659.25, 587.33, 493.88, 587.33, -1, 739.99, -1]
                    },
                    palette: { bass: { type: 'sine', vol: 0.8 }, arp: { type: 'sine', vol: 0.45 }, melody: { type: 'triangle', vol: 0.65 } },
                    bossPalette: { bass: { type: 'sawtooth', vol: 0.7 }, arp: { type: 'square', vol: 0.35 }, melody: { type: 'square', vol: 0.65 } }
                },
                // World 9: Cotton Candy Cloud (Levels 41-45) - Dreamy Floating Eb Major
                9: {
                    name: 'Cotton Candy Cloud',
                    tempo: 78,
                    chords: [
                        { bass: 77.78,  arp: [311.13, 392.00, 466.16], arp_alt: [466.16, 392.00, 311.13], arp_bounce: [311.13, 466.16, 392.00] },
                        { bass: 103.83, arp: [311.13, 415.30, 466.16], arp_alt: [466.16, 415.30, 311.13], arp_bounce: [311.13, 466.16, 415.30] },
                        { bass: 130.81, arp: [261.63, 311.13, 392.00], arp_alt: [392.00, 311.13, 261.63], arp_bounce: [261.63, 392.00, 311.13] },
                        { bass: 116.54, arp: [293.66, 349.23, 466.16], arp_alt: [466.16, 349.23, 293.66], arp_bounce: [293.66, 466.16, 349.23] }
                    ],
                    melodies: {
                        A: [622.25, 783.99, 932.33, 783.99, 830.61, -1, 622.25, 830.61, 783.99, 622.25, 523.25, -1, 466.16, 587.33, 622.25, -1],
                        B: [932.33, 830.61, 783.99, 622.25, 587.33, 622.25, 783.99, -1, 830.61, 783.99, 622.25, 466.16, 622.25, -1, -1, -1]
                    },
                    palette: { bass: { type: 'sine', vol: 0.85 }, arp: { type: 'sine', vol: 0.45 }, melody: { type: 'triangle', vol: 0.7 } }
                },
                // World 10: Peppermint Peak (Levels 46-50) - Frigid Alpine Staccato B Minor
                10: {
                    name: 'Peppermint Peak',
                    tempo: 84,
                    chords: [
                        { bass: 123.47, arp: [293.66, 369.99, 493.88], arp_alt: [493.88, 369.99, 293.66], arp_bounce: [293.66, 493.88, 369.99] },
                        { bass: 73.42,  arp: [293.66, 369.99, 440.00], arp_alt: [440.00, 369.99, 293.66], arp_bounce: [293.66, 440.00, 369.99] },
                        { bass: 98.00,  arp: [293.66, 392.00, 493.88], arp_alt: [493.88, 392.00, 293.66], arp_bounce: [293.66, 493.88, 392.00] },
                        { bass: 92.50,  arp: [277.18, 369.99, 440.00], arp_alt: [440.00, 369.99, 277.18], arp_bounce: [277.18, 440.00, 369.99] }
                    ],
                    melodies: {
                        A: [739.99, 880.00, 987.77, 880.00, 739.99, -1, 587.33, 739.99, 783.99, 739.99, 587.33, -1, 493.88, 587.33, 739.99, -1],
                        B: [987.77, -1, 880.00, 739.99, 587.33, 739.99, 880.00, 987.77, 880.00, 739.99, 587.33, 493.88, 440.00, 493.88, -1, -1]
                    },
                    palette: { bass: { type: 'triangle', vol: 0.8 }, arp: { type: 'sine', vol: 0.45 }, melody: { type: 'square', vol: 0.55 } },
                    bossPalette: { bass: { type: 'sawtooth', vol: 0.7 }, arp: { type: 'square', vol: 0.35 }, melody: { type: 'sawtooth', vol: 0.65 } }
                },
                // World 11: Caramel Caverns (Levels 51-55) - Warm Subterranean C Minor
                11: {
                    name: 'Caramel Caverns',
                    tempo: 86,
                    chords: [
                        { bass: 130.81, arp: [261.63, 311.13, 392.00], arp_alt: [392.00, 311.13, 261.63], arp_bounce: [261.63, 392.00, 311.13] },
                        { bass: 87.31,  arp: [261.63, 349.23, 415.30], arp_alt: [415.30, 349.23, 261.63], arp_bounce: [261.63, 415.30, 349.23] },
                        { bass: 103.83, arp: [261.63, 311.13, 415.30], arp_alt: [415.30, 311.13, 261.63], arp_bounce: [261.63, 415.30, 311.13] },
                        { bass: 116.54, arp: [293.66, 349.23, 466.16], arp_alt: [466.16, 349.23, 293.66], arp_bounce: [293.66, 466.16, 349.23] }
                    ],
                    melodies: {
                        A: [622.25, -1, 523.25, 622.25, 698.46, 622.25, 523.25, -1, 830.61, 783.99, 698.46, 622.25, 523.25, 622.25, 466.16, -1],
                        B: [783.99, 698.46, 622.25, 523.25, 622.25, 698.46, 783.99, -1, 698.46, 622.25, 523.25, 466.16, 523.25, -1, -1, -1]
                    },
                    palette: { bass: { type: 'triangle', vol: 0.85 }, arp: { type: 'triangle', vol: 0.3 }, melody: { type: 'sawtooth', vol: 0.5 } }
                },
                // World 12: Sugar Citadel (Levels 56-60) - Regal Heroic Anthem
                12: {
                    name: 'Sugar Citadel',
                    tempo: 96,
                    chords: [
                        { bass: 110.00, arp: [261.63, 329.63, 440.00], arp_alt: [440.00, 329.63, 261.63], arp_bounce: [261.63, 440.00, 329.63] },
                        { bass: 87.31,  arp: [261.63, 349.23, 440.00], arp_alt: [440.00, 349.23, 261.63], arp_bounce: [261.63, 440.00, 349.23] },
                        { bass: 130.81, arp: [261.63, 329.63, 392.00], arp_alt: [392.00, 329.63, 261.63], arp_bounce: [261.63, 392.00, 329.63] },
                        { bass: 98.00,  arp: [293.66, 392.00, 493.88], arp_alt: [493.88, 392.00, 293.66], arp_bounce: [293.66, 493.88, 392.00] }
                    ],
                    melodies: {
                        A: [880.00, -1, 783.99, 880.00, 1046.50, -1, 880.00, 783.99, 659.25, 783.99, 880.00, -1, 783.99, 659.25, 523.25, -1],
                        B: [1046.50, 987.77, 880.00, 783.99, 880.00, 1046.50, 1174.66, -1, 1046.50, 880.00, 783.99, 659.25, 783.99, -1, 880.00, -1]
                    },
                    palette: { bass: { type: 'triangle', vol: 0.85 }, arp: { type: 'square', vol: 0.32 }, melody: { type: 'square', vol: 0.65 } },
                    bossPalette: { bass: { type: 'sawtooth', vol: 0.8 }, arp: { type: 'square', vol: 0.38 }, melody: { type: 'sawtooth', vol: 0.7 } }
                }
            }
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
