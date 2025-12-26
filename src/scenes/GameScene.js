import Board from '../objects/Board.js';
import SoundManager from '../systems/SoundManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.currentLevel = data.level || 1;
        this.score = 0;
        this.movesRemaining = 0;
        this.targetScore = 0;
        this.objective = 'score'; // 'score' or 'clearJelly'
        this.jellyTarget = 0;
        this.jellyCleared = 0;
        this.isGameOver = false;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Initialize Sound Manager
        this.soundManager = new SoundManager(this);

        // Load level data
        this.loadLevel(this.currentLevel);

        // Background
        this.createBackground(width, height);

        // Create the game board
        this.createBoard(width, height);

        // HUD
        this.createHUD(width, height);

        // Set up event listeners
        this.setupEvents();

        // Particle emitter for candy clears
        this.createParticles();

        // Hint system
        this.setupHintSystem();

        // Show tutorial for new mechanics
        this.showTutorialIfNeeded();

        // Register shutdown handler for cleanup
        this.events.on('shutdown', this.shutdown, this);
    }

    showTutorialIfNeeded() {
        const tutorials = {
            6: {
                title: 'New: Jelly Tiles!',
                text: 'Clear the pink jelly by\nmatching candies on top of it.',
                icon: '🍮'
            },
            8: {
                title: 'New: Locked Tiles!',
                text: 'Locked candies can\'t move.\nMatch next to them to break the lock.',
                icon: '🔒'
            },
            11: {
                title: 'Double Jelly!',
                text: 'Dark jelly needs TWO matches\nto clear completely.',
                icon: '🍮🍮'
            }
        };

        const tutorial = tutorials[this.currentLevel];
        if (!tutorial) return;

        // Check if user has seen this tutorial
        const seenKey = `sugarSplash_tutorial_${this.currentLevel}`;
        if (localStorage.getItem(seenKey)) return;

        this.board.inputLocked = true;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Semi-transparent overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.6);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(100);

        // Tutorial container
        const container = this.add.container(width / 2, height / 2);
        container.setDepth(101);

        // Background panel
        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 0.95);
        panel.fillRoundedRect(-160, -120, 320, 240, 20);
        container.add(panel);

        // Icon
        const icon = this.add.text(0, -70, tutorial.icon, {
            fontSize: '48px'
        }).setOrigin(0.5);
        container.add(icon);

        // Title
        const title = this.add.text(0, -20, tutorial.title, {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '28px',
            color: '#ff6b9d'
        }).setOrigin(0.5);
        container.add(title);

        // Description
        const desc = this.add.text(0, 40, tutorial.text, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#333333',
            align: 'center'
        }).setOrigin(0.5);
        container.add(desc);

        // Got it button
        const btn = this.add.image(0, 100, 'button').setInteractive({ useHandCursor: true });
        const btnText = this.add.text(0, 100, 'Got it!', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '22px',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(btn);
        container.add(btnText);

        btn.on('pointerover', () => btn.setScale(1.1));
        btn.on('pointerout', () => btn.setScale(1));
        btn.on('pointerup', () => {
            localStorage.setItem(seenKey, 'true');
            overlay.destroy();
            container.destroy();
            this.board.inputLocked = false;
            this.resetHintTimer();
        });

        // Entrance animation
        container.setScale(0.5);
        container.setAlpha(0);
        this.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    loadLevel(levelNum) {
        // Level definitions (will move to JSON later)
        const levels = {
            // Levels 1-5: Basic score objectives (relaxed targets)
            1: { moves: 30, objective: 'score', targetScore: 500, rows: 8, cols: 8, candyTypes: 5 },
            2: { moves: 30, objective: 'score', targetScore: 800, rows: 8, cols: 8, candyTypes: 5 },
            3: { moves: 30, objective: 'score', targetScore: 1000, rows: 8, cols: 8, candyTypes: 5 },
            4: { moves: 30, objective: 'score', targetScore: 1200, rows: 8, cols: 8, candyTypes: 6 },
            5: { moves: 30, objective: 'score', targetScore: 1500, rows: 8, cols: 8, candyTypes: 6 },

            // Level 6: Introduce jelly (single layer, small pattern)
            6: {
                moves: 30,
                objective: 'clearJelly',
                targetScore: 0,
                rows: 8, cols: 8, candyTypes: 6,
                jelly: [
                    { row: 3, col: 3 }, { row: 3, col: 4 },
                    { row: 4, col: 3 }, { row: 4, col: 4 }
                ]
            },

            // Level 7: More jelly
            7: {
                moves: 30,
                objective: 'clearJelly',
                targetScore: 0,
                rows: 8, cols: 8, candyTypes: 6,
                jelly: [
                    { row: 2, col: 3 }, { row: 2, col: 4 },
                    { row: 3, col: 2 }, { row: 3, col: 5 },
                    { row: 4, col: 2 }, { row: 4, col: 5 },
                    { row: 5, col: 3 }, { row: 5, col: 4 }
                ]
            },

            // Level 8: Introduce locked tiles with score objective
            8: {
                moves: 30,
                objective: 'score',
                targetScore: 1000,
                rows: 8, cols: 8, candyTypes: 6,
                locked: [
                    { row: 3, col: 3 }, { row: 4, col: 4 }
                ]
            },

            // Level 9: Locked tiles with more spread
            9: {
                moves: 30,
                objective: 'score',
                targetScore: 1200,
                rows: 8, cols: 8, candyTypes: 6,
                locked: [
                    { row: 2, col: 2 }, { row: 2, col: 5 },
                    { row: 5, col: 2 }, { row: 5, col: 5 }
                ]
            },

            // Level 10: Jelly + locked combo
            10: {
                moves: 35,
                objective: 'clearJelly',
                targetScore: 0,
                rows: 8, cols: 8, candyTypes: 6,
                jelly: [
                    { row: 2, col: 3 }, { row: 2, col: 4 },
                    { row: 5, col: 3 }, { row: 5, col: 4 }
                ],
                locked: [
                    { row: 3, col: 3 }, { row: 4, col: 4 }
                ]
            },

            // Level 11: Introduce double jelly (small)
            11: {
                moves: 35,
                objective: 'clearJelly',
                targetScore: 0,
                rows: 8, cols: 8, candyTypes: 6,
                jelly: [
                    { row: 3, col: 3, layers: 2 }, { row: 3, col: 4, layers: 2 },
                    { row: 4, col: 3, layers: 2 }, { row: 4, col: 4, layers: 2 }
                ]
            },

            // Level 12: Double jelly with singles
            12: {
                moves: 35,
                objective: 'clearJelly',
                targetScore: 0,
                rows: 8, cols: 8, candyTypes: 6,
                jelly: [
                    { row: 3, col: 3, layers: 2 }, { row: 3, col: 4, layers: 2 },
                    { row: 4, col: 3, layers: 2 }, { row: 4, col: 4, layers: 2 },
                    { row: 2, col: 3 }, { row: 2, col: 4 },
                    { row: 5, col: 3 }, { row: 5, col: 4 }
                ]
            },

            // Level 13: Mixed challenge
            13: {
                moves: 35,
                objective: 'clearJelly',
                targetScore: 0,
                rows: 8, cols: 8, candyTypes: 6,
                jelly: [
                    { row: 2, col: 2 }, { row: 2, col: 5 },
                    { row: 5, col: 2 }, { row: 5, col: 5 },
                    { row: 3, col: 3, layers: 2 }, { row: 4, col: 4, layers: 2 }
                ],
                locked: [
                    { row: 3, col: 4 }, { row: 4, col: 3 }
                ]
            },

            // Level 14: Score with blockers
            14: {
                moves: 30,
                objective: 'score',
                targetScore: 1500,
                rows: 8, cols: 8, candyTypes: 6,
                locked: [
                    { row: 2, col: 2 }, { row: 2, col: 5 },
                    { row: 5, col: 2 }, { row: 5, col: 5 }
                ]
            },

            // Level 15: Larger jelly area
            15: {
                moves: 40,
                objective: 'clearJelly',
                targetScore: 0,
                rows: 8, cols: 8, candyTypes: 6,
                jelly: [
                    { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
                    { row: 3, col: 2 }, { row: 3, col: 5 },
                    { row: 4, col: 2 }, { row: 4, col: 5 },
                    { row: 5, col: 2 }, { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 }
                ]
            },

            // Level 16: Lock fortress
            16: {
                moves: 35,
                objective: 'score',
                targetScore: 1800,
                rows: 8, cols: 8, candyTypes: 6,
                locked: [
                    { row: 2, col: 3 }, { row: 2, col: 4 },
                    { row: 3, col: 2 }, { row: 3, col: 5 },
                    { row: 4, col: 2 }, { row: 4, col: 5 },
                    { row: 5, col: 3 }, { row: 5, col: 4 }
                ]
            },

            // Level 17: Dense jelly
            17: {
                moves: 45,
                objective: 'clearJelly',
                targetScore: 0,
                rows: 8, cols: 8, candyTypes: 6,
                jelly: [
                    { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 }, { row: 1, col: 5 },
                    { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 5 }, { row: 2, col: 6 },
                    { row: 5, col: 1 }, { row: 5, col: 2 }, { row: 5, col: 5 }, { row: 5, col: 6 },
                    { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 }
                ]
            },

            // Level 18: Hard mixed
            18: {
                moves: 40,
                objective: 'clearJelly',
                targetScore: 0,
                rows: 8, cols: 8, candyTypes: 6,
                jelly: [
                    { row: 2, col: 2, layers: 2 }, { row: 2, col: 5, layers: 2 },
                    { row: 5, col: 2, layers: 2 }, { row: 5, col: 5, layers: 2 },
                    { row: 3, col: 3 }, { row: 3, col: 4 },
                    { row: 4, col: 3 }, { row: 4, col: 4 }
                ],
                locked: [
                    { row: 3, col: 2 }, { row: 4, col: 5 }
                ]
            },

            // Level 19: Corner challenge
            19: {
                moves: 45,
                objective: 'clearJelly',
                targetScore: 0,
                rows: 8, cols: 8, candyTypes: 6,
                jelly: [
                    { row: 0, col: 0, layers: 2 }, { row: 0, col: 1 }, { row: 1, col: 0 },
                    { row: 0, col: 7, layers: 2 }, { row: 0, col: 6 }, { row: 1, col: 7 },
                    { row: 7, col: 0, layers: 2 }, { row: 7, col: 1 }, { row: 6, col: 0 },
                    { row: 7, col: 7, layers: 2 }, { row: 7, col: 6 }, { row: 6, col: 7 }
                ]
            },

            // Level 20: Ultimate challenge
            20: {
                moves: 50,
                objective: 'clearJelly',
                targetScore: 0,
                rows: 8, cols: 8, candyTypes: 6,
                jelly: [
                    { row: 1, col: 1, layers: 2 }, { row: 1, col: 6, layers: 2 },
                    { row: 6, col: 1, layers: 2 }, { row: 6, col: 6, layers: 2 },
                    { row: 2, col: 2 }, { row: 2, col: 5 },
                    { row: 5, col: 2 }, { row: 5, col: 5 },
                    { row: 3, col: 3 }, { row: 3, col: 4 },
                    { row: 4, col: 3 }, { row: 4, col: 4 }
                ],
                locked: [
                    { row: 0, col: 3 }, { row: 0, col: 4 },
                    { row: 7, col: 3 }, { row: 7, col: 4 }
                ]
            }
        };

        const level = levels[levelNum] || levels[1];
        this.movesRemaining = level.moves;
        this.targetScore = level.targetScore || 0;
        this.objective = level.objective || 'score';
        this.levelConfig = level;

        // Calculate jelly target for clearJelly objective
        if (this.objective === 'clearJelly' && level.jelly) {
            this.jellyTarget = level.jelly.reduce((sum, cell) => sum + (cell.layers || 1), 0);
        }
    }

    // Helper to generate full board single jelly
    generateFullBoardJelly(rows, cols) {
        const jelly = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                jelly.push({ row, col });
            }
        }
        return jelly;
    }

    // Helper to generate challenge jelly pattern
    generateChallengeJelly() {
        const jelly = [];
        // Outer ring double jelly
        for (let i = 0; i < 8; i++) {
            jelly.push({ row: 0, col: i, layers: 2 });
            jelly.push({ row: 7, col: i, layers: 2 });
            if (i > 0 && i < 7) {
                jelly.push({ row: i, col: 0, layers: 2 });
                jelly.push({ row: i, col: 7, layers: 2 });
            }
        }
        // Inner single jelly
        for (let row = 2; row <= 5; row++) {
            for (let col = 2; col <= 5; col++) {
                jelly.push({ row, col });
            }
        }
        return jelly;
    }

    createBackground(width, height) {
        const graphics = this.add.graphics();
        const steps = 20;
        for (let i = 0; i < steps; i++) {
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 255, g: 182, b: 193 },
                { r: 173, g: 216, b: 230 },
                steps,
                i
            );
            graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
            graphics.fillRect(0, (height / steps) * i, width, height / steps + 1);
        }
    }

    createBoard(width, height) {
        const boardSize = Math.min(width - 40, height - 320);
        const cellSize = boardSize / 8;
        const boardX = (width - boardSize) / 2;
        const boardY = 160;

        // Board background
        const boardBg = this.add.graphics();
        boardBg.fillStyle(0x000000, 0.2);
        boardBg.fillRoundedRect(boardX - 15, boardY - 15, boardSize + 30, boardSize + 30, 20);

        // Create the board
        this.board = new Board(this, {
            rows: this.levelConfig.rows,
            cols: this.levelConfig.cols,
            x: boardX,
            y: boardY,
            cellSize: cellSize,
            candyTypes: this.levelConfig.candyTypes,
            levelConfig: this.levelConfig
        });
    }

    createHUD(width, height) {
        // Top bar background
        const topBar = this.add.graphics();
        topBar.fillStyle(0x000000, 0.3);
        topBar.fillRoundedRect(20, 20, width - 40, 120, 15);

        // Level number
        this.add.text(40, 35, `Level ${this.currentLevel}`, {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });

        // Moves counter
        this.movesText = this.add.text(width - 40, 35, `Moves: ${this.movesRemaining}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(1, 0);

        // Objective display
        if (this.objective === 'clearJelly') {
            const remaining = this.jellyTarget - this.jellyCleared;
            this.objectiveText = this.add.text(width / 2, 80, `🍮 Jelly: ${remaining}`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '26px',
                color: '#ff69b4',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
        } else {
            this.objectiveText = this.add.text(width / 2, 80, `🎯 ${this.score} / ${this.targetScore}`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '26px',
                color: '#ffeb3b',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
        }

        // Progress bar
        const progressBarWidth = width - 100;
        const progressBarX = 50;
        const progressBarY = 115;

        this.progressBarBg = this.add.graphics();
        this.progressBarBg.fillStyle(0x000000, 0.5);
        this.progressBarBg.fillRoundedRect(progressBarX, progressBarY, progressBarWidth, 16, 8);

        this.progressBar = this.add.graphics();
        this.currentProgress = 0; // Track current visual progress for animation
        this.updateProgressBar();

        // Score display at bottom
        const bottomBar = this.add.graphics();
        bottomBar.fillStyle(0x000000, 0.3);
        bottomBar.fillRoundedRect(20, height - 80, width - 40, 60, 15);

        this.scoreText = this.add.text(width / 2, height - 50, `Score: ${this.score}`, {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Combo text (hidden by default) - positioned above the board
        this.comboText = this.add.text(width / 2, 155, '', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '42px',
            color: '#ffeb3b',
            stroke: '#ff6b9d',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0).setDepth(50);
    }

    updateProgressBar() {
        const width = this.cameras.main.width;
        const progressBarWidth = width - 100;
        const progressBarX = 50;
        const progressBarY = 115;

        let targetProgress;
        let color;

        if (this.objective === 'clearJelly') {
            targetProgress = this.jellyTarget > 0 ? Math.min(this.jellyCleared / this.jellyTarget, 1) : 0;
            color = 0xff69b4; // Pink for jelly
        } else {
            targetProgress = this.targetScore > 0 ? Math.min(this.score / this.targetScore, 1) : 0;
            color = 0x4ade80; // Green for score
        }

        // Kill any existing progress tween
        if (this.progressTween) {
            this.progressTween.stop();
        }

        // Store color for redraw
        this.progressBarColor = color;

        // Animate progress smoothly
        this.progressTween = this.tweens.add({
            targets: this,
            currentProgress: targetProgress,
            duration: 300,
            ease: 'Power2',
            onUpdate: () => {
                this.redrawProgressBar(progressBarX, progressBarY, progressBarWidth);
            }
        });
    }

    redrawProgressBar(x, y, maxWidth) {
        this.progressBar.clear();
        if (this.currentProgress > 0) {
            this.progressBar.fillStyle(this.progressBarColor, 1);
            this.progressBar.fillRoundedRect(x, y, maxWidth * this.currentProgress, 16, 8);
        }
    }

    setupEvents() {
        // Score update from board
        this.events.on('scoreUpdate', (points, cascadeLevel) => {
            this.score += points;
            this.scoreText.setText(`Score: ${this.score}`);
            
            // Play sound
            this.soundManager.play(cascadeLevel > 1 ? 'cascade' : 'match');

            // Update objective display based on type
            if (this.objective === 'score') {
                this.objectiveText.setText(`🎯 ${this.score} / ${this.targetScore}`);
            }
            this.updateProgressBar();

            // Show combo text for cascades
            if (cascadeLevel > 1) {
                this.showCombo(cascadeLevel);
            }

            // Reset hint timer
            this.resetHintTimer();
        });

        // Special activated event
        this.events.on('specialActivated', (type) => {
            this.soundManager.play(type === 'bomb' ? 'bomb' : 'line');
        });

        // Jelly cleared event
        this.events.on('jellyCleared', (row, col) => {
            this.jellyCleared++;
            this.soundManager.play('line');
            const remaining = this.jellyTarget - this.jellyCleared;
            this.objectiveText.setText(`🍮 Jelly: ${remaining}`);
            this.updateProgressBar();

            // Animate objective text
            this.tweens.add({
                targets: this.objectiveText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100,
                yoyo: true
            });
        });

        // Jelly hit (double->single) event
        this.events.on('jellyHit', (row, col) => {
            this.jellyCleared++;
            this.soundManager.play('click');
            const remaining = this.jellyTarget - this.jellyCleared;
            this.objectiveText.setText(`🍮 Jelly: ${remaining}`);
            this.updateProgressBar();
        });

        // Lock broken event
        this.events.on('lockBroken', (row, col) => {
            this.soundManager.play('line');
            // Visual feedback - screen flash
            this.cameras.main.flash(100, 135, 206, 235, false);
        });

        // Valid swap - decrement moves
        this.events.on('validSwap', () => {
            this.soundManager.play('swap');
            this.movesRemaining--;
            this.movesText.setText(`Moves: ${this.movesRemaining}`);

            // Animate moves text when low
            if (this.movesRemaining <= 5) {
                this.tweens.add({
                    targets: this.movesText,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 100,
                    yoyo: true
                });
                this.movesText.setColor('#ff4757');
            }

            // Reset hint timer
            this.resetHintTimer();
        });

        // Cascade complete - check win/lose conditions
        this.events.on('cascadeComplete', () => {
            if (this.isGameOver) return;

            // Check win condition
            let hasWon = false;
            if (this.objective === 'score') {
                hasWon = this.score >= this.targetScore;
            } else if (this.objective === 'clearJelly') {
                hasWon = this.jellyCleared >= this.jellyTarget;
            }

            if (hasWon) {
                this.showWinScreen();
                return;
            }

            // Check lose condition (only if out of moves and haven't won)
            if (this.movesRemaining <= 0) {
                this.showLoseScreen();
            }
        });

        // Invalid swap feedback
        this.events.on('invalidSwap', () => {
            this.soundManager.play('invalid');
            // Could add shake or sound effect here
            this.resetHintTimer();
        });

        // Candy cleared - for particles
        this.events.on('candyCleared', (row, col, type) => {
            this.emitParticles(row, col, type);
        });
    }

    showCombo(level) {
        this.comboText.setText(`×${level} COMBO!`);
        this.comboText.setAlpha(1);
        this.comboText.setScale(0.5);

        this.tweens.add({
            targets: this.comboText,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0,
            duration: 800,
            ease: 'Power2'
        });
    }

    createParticles() {
        // Create particle textures for each candy color (only if not already created)
        const colors = [0xff4757, 0x3742fa, 0x2ed573, 0xffa502, 0xa55eea, 0xff7f50];

        this.particleEmitters = [];

        colors.forEach((color, index) => {
            const textureKey = `particle_${index}`;

            // Only create texture if it doesn't exist
            if (!this.textures.exists(textureKey)) {
                const graphics = this.add.graphics();
                graphics.fillStyle(color, 1);
                graphics.fillCircle(8, 8, 8);
                graphics.generateTexture(textureKey, 16, 16);
                graphics.destroy();
            }

            // Create emitter
            const emitter = this.add.particles(0, 0, textureKey, {
                speed: { min: 100, max: 200 },
                scale: { start: 0.6, end: 0 },
                lifespan: 500,
                gravityY: 300,
                emitting: false
            });

            this.particleEmitters[index] = emitter;
        });
    }

    emitParticles(row, col, candyType) {
        const pos = this.board.gridToWorld(row, col);
        const emitter = this.particleEmitters[candyType];

        if (emitter) {
            emitter.setPosition(pos.x, pos.y);
            emitter.explode(8);
        }
    }

    setupHintSystem() {
        // Only show hints on certain tutorial levels
        // 1, 2: Basic match-3 introduction
        // 6: First jelly level
        // 8: First locked tiles level
        // 11: Double jelly introduction
        const hintLevels = [1, 2, 6, 8, 11];
        this.hintsEnabled = hintLevels.includes(this.currentLevel);

        this.hintTimer = null;
        this.hintCandies = [];

        if (this.hintsEnabled) {
            this.resetHintTimer();
        }
    }

    resetHintTimer() {
        // Clear existing hint
        this.clearHint();

        if (!this.hintsEnabled) return;

        // Clear existing timer
        if (this.hintTimer) {
            this.hintTimer.remove();
        }

        // Set new timer
        this.hintTimer = this.time.delayedCall(5000, () => this.showHint());
    }

    showHint() {
        if (this.isGameOver || this.board.inputLocked) return;

        const validMove = this.board.findValidMove();
        if (!validMove) return;

        // Visual Hint: Hand cursor moving between the two candies
        const [cell1, cell2] = validMove;
        const pos1 = this.board.gridToWorld(cell1.row, cell1.col);
        const pos2 = this.board.gridToWorld(cell2.row, cell2.col);

        if (!this.hintHand) {
            this.hintHand = this.add.sprite(0, 0, 'hand').setDepth(100);
        }
        
        this.hintHand.setPosition(pos1.x, pos1.y);
        this.hintHand.setVisible(true);
        this.hintHand.setAlpha(1);

        this.hintHandTween = this.tweens.add({
            targets: this.hintHand,
            x: pos2.x,
            y: pos2.y,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Also highlight the candies slightly
        validMove.forEach(cell => {
            const candy = this.board.candies[cell.row][cell.col];
            if (candy) {
                this.hintCandies.push(candy);
                this.tweens.add({
                    targets: candy,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 400,
                    yoyo: true,
                    repeat: -1
                });
            }
        });
    }

    clearHint() {
        if (this.hintHand) {
            this.hintHand.setVisible(false);
            if (this.hintHandTween) {
                this.hintHandTween.stop();
                this.hintHandTween = null;
            }
        }

        this.hintCandies.forEach(candy => {
            if (candy && candy.active) {
                this.tweens.killTweensOf(candy);
                candy.setScale(1);
            }
        });
        this.hintCandies = [];
    }

    checkWinCondition() {
        if (this.isGameOver) return;

        let hasWon = false;
        if (this.objective === 'score') {
            hasWon = this.score >= this.targetScore;
        } else if (this.objective === 'clearJelly') {
            hasWon = this.jellyCleared >= this.jellyTarget;
        }

        if (hasWon) {
            this.showWinScreen();
        }
    }

    async showWinScreen() {
        this.isGameOver = true;
        this.board.inputLocked = true;
        this.clearHint();

        // Play Bonus Round if moves remaining
        if (this.movesRemaining > 0) {
            await this.playBonusRound();
        }

        this.soundManager.play('win');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Calculate stars based on moves remaining (generous thresholds)
        // Note: movesRemaining is now 0 after bonus round, so we use the stored initial moves
        // actually we already burned them. We should track score efficiency instead.
        // Or just give stars based on Final Score vs Target Score.
        const scoreRatio = this.score / this.targetScore;
        let stars = 1;
        if (scoreRatio >= 1.2) stars = 2;
        if (scoreRatio >= 1.5) stars = 3;

        // Update score display
        this.scoreText.setText(`Score: ${this.score}`);

        // Save progress
        this.saveProgress(stars);

        // Overlay - high depth to appear above game board
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(500);

        // Win container - even higher depth
        const container = this.add.container(width / 2, height / 2);
        container.setDepth(501);

        // Background panel
        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 0.95);
        panel.fillRoundedRect(-180, -220, 360, 440, 25);
        container.add(panel);

        // Title
        const title = this.add.text(0, -170, 'Level Complete!', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '36px',
            color: '#4ade80'
        }).setOrigin(0.5);
        container.add(title);

        // Stars
        for (let i = 0; i < 3; i++) {
            const starX = -60 + i * 60;
            const star = this.add.image(starX, -90, i < stars ? 'star_filled' : 'star_empty');
            star.setScale(0);
            container.add(star);

            // Animate stars
            this.tweens.add({
                targets: star,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 300,
                delay: 200 + i * 200,
                ease: 'Back.easeOut'
            });
        }

        // Score
        const scoreText = this.add.text(0, -10, `Score: ${this.score}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '28px',
            color: '#333333'
        }).setOrigin(0.5);
        container.add(scoreText);

        // Next level button
        if (this.currentLevel < 20) {
            this.createWinButton(container, 0, 100, 'Next Level', () => {
                this.scene.restart({ level: this.currentLevel + 1 });
            });
        } else {
            this.createWinButton(container, 0, 100, 'Main Menu', () => {
                this.scene.start('MenuScene');
            });
        }

        // Replay button
        this.createWinButton(container, 0, 170, 'Replay', () => {
            this.scene.restart({ level: this.currentLevel });
        });

        // Menu button
        const menuBtn = this.add.text(0, 230, 'Level Select', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            color: '#666666'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        container.add(menuBtn);

        menuBtn.on('pointerover', () => menuBtn.setColor('#ff6b9d'));
        menuBtn.on('pointerout', () => menuBtn.setColor('#666666'));
        menuBtn.on('pointerup', () => this.scene.start('LevelSelectScene'));

        // Entrance animation
        container.setScale(0.5);
        container.setAlpha(0);
        this.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
    }

    async playBonusRound() {
        const title = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'SUGAR CRUSH!', {
            fontFamily: 'Arial Black', fontSize: '64px', color: '#ffeb3b', stroke: '#ff0000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(1000).setScale(0);

        this.tweens.add({
            targets: title, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.out',
            yoyo: true, hold: 1000, onComplete: () => title.destroy()
        });

        await new Promise(r => this.time.delayedCall(1500, r));

        // Convert moves to specials
        while (this.movesRemaining > 0) {
            this.movesRemaining--;
            this.movesText.setText(`Moves: ${this.movesRemaining}`);
            this.soundManager.play('swap');

            // Pick random non-special candy
            const candidates = [];
            for (let r = 0; r < this.board.rows; r++) {
                for (let c = 0; c < this.board.cols; c++) {
                    const candy = this.board.candies[r][c];
                    if (candy && !candy.isSpecial) candidates.push(candy);
                }
            }

            if (candidates.length > 0) {
                const target = Phaser.Utils.Array.GetRandom(candidates);
                const type = Math.random() > 0.7 ? 'bomb' : (Math.random() > 0.5 ? 'line_h' : 'line_v');
                target.makeSpecial(type);
                
                // Add score
                this.score += 2000;
                this.scoreText.setText(`Score: ${this.score}`);
                
                // Visual delay
                await new Promise(r => this.time.delayedCall(200, r));
            }
        }

        // Explode everything
        await this.board.detonateAllSpecials();
    }

    showLoseScreen() {
        this.isGameOver = true;
        this.soundManager.play('invalid');
        this.board.inputLocked = true;
        this.clearHint();

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Overlay - high depth to appear above game board
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(500);

        // Lose container - even higher depth
        const container = this.add.container(width / 2, height / 2);
        container.setDepth(501);

        // Background panel
        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 0.95);
        panel.fillRoundedRect(-180, -180, 360, 360, 25);
        container.add(panel);

        // Title
        const title = this.add.text(0, -130, 'Out of Moves!', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '36px',
            color: '#ff4757'
        }).setOrigin(0.5);
        container.add(title);

        // Objective status
        let statusText, targetText;
        if (this.objective === 'clearJelly') {
            const remaining = this.jellyTarget - this.jellyCleared;
            statusText = this.add.text(0, -60, `Jelly left: ${remaining}`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '28px',
                color: '#ff69b4'
            }).setOrigin(0.5);

            targetText = this.add.text(0, -20, `Clear all jelly to win!`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '20px',
                color: '#666666'
            }).setOrigin(0.5);
        } else {
            statusText = this.add.text(0, -60, `Score: ${this.score}`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '28px',
                color: '#333333'
            }).setOrigin(0.5);

            targetText = this.add.text(0, -20, `Target: ${this.targetScore}`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '20px',
                color: '#666666'
            }).setOrigin(0.5);
        }
        container.add(statusText);
        container.add(targetText);

        // Try again button
        this.createWinButton(container, 0, 60, 'Try Again', () => {
            this.scene.restart({ level: this.currentLevel });
        });

        // Level select button
        const menuBtn = this.add.text(0, 140, 'Level Select', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            color: '#666666'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        container.add(menuBtn);

        menuBtn.on('pointerover', () => menuBtn.setColor('#ff6b9d'));
        menuBtn.on('pointerout', () => menuBtn.setColor('#666666'));
        menuBtn.on('pointerup', () => this.scene.start('LevelSelectScene'));

        // Entrance animation
        container.setScale(0.5);
        container.setAlpha(0);
        this.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
    }

    saveProgress(stars) {
        try {
            const saveKey = 'sugarSplash_save';
            let saveData = localStorage.getItem(saveKey);
            saveData = saveData ? JSON.parse(saveData) : { levels: {} };

            // Update level data
            const existingData = saveData.levels[this.currentLevel] || { completed: false, stars: 0, bestScore: 0 };
            saveData.levels[this.currentLevel] = {
                completed: true,
                stars: Math.max(existingData.stars, stars),
                bestScore: Math.max(existingData.bestScore, this.score)
            };

            localStorage.setItem(saveKey, JSON.stringify(saveData));
        } catch (e) {
            console.warn('Failed to save progress:', e);
        }
    }

    showPauseMenu() {
        if (this.isGameOver || !this.isPaused) return;

        this.board.inputLocked = true;
        this.clearHint();

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Pause overlay - high depth to appear above game board
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(500);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

        // Pause menu container - even higher depth
        const menuContainer = this.add.container(width / 2, height / 2);
        menuContainer.setDepth(501);

        // Menu background
        const menuBg = this.add.graphics();
        menuBg.fillStyle(0xffffff, 0.95);
        menuBg.fillRoundedRect(-150, -180, 300, 360, 20);
        menuContainer.add(menuBg);

        // Paused title
        const pausedText = this.add.text(0, -140, 'PAUSED', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '36px',
            color: '#ff6b9d'
        }).setOrigin(0.5);
        menuContainer.add(pausedText);

        // Resume button
        this.createMenuButton(menuContainer, 0, -60, 'Resume', () => {
            overlay.destroy();
            menuContainer.destroy();
            this.board.inputLocked = false;
            this.isPaused = false;
            this.resetHintTimer();
        });

        // Restart button
        this.createMenuButton(menuContainer, 0, 10, 'Restart', () => {
            this.scene.restart({ level: this.currentLevel });
        });

        // Quit button
        this.createMenuButton(menuContainer, 0, 80, 'Quit', () => {
            this.showQuitConfirmation(overlay, menuContainer);
        });

        // Sound toggle
        const soundOn = localStorage.getItem('sugarSplash_sound') !== 'false';
        const soundText = this.add.text(0, 150, soundOn ? '🔊 Sound On' : '🔇 Sound Off', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#666666'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        menuContainer.add(soundText);

        soundText.on('pointerup', () => {
            const currentState = localStorage.getItem('sugarSplash_sound') !== 'false';
            const newState = !currentState;
            localStorage.setItem('sugarSplash_sound', newState.toString());
            soundText.setText(newState ? '🔊 Sound On' : '🔇 Sound Off');
            this.sound.mute = !newState;
        });
    }

    createMenuButton(container, x, y, text, callback) {
        const btn = this.add.image(x, y, 'button').setInteractive({ useHandCursor: true });
        const btnText = this.add.text(x, y, text, {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        container.add(btn);
        container.add(btnText);

        btn.on('pointerover', () => btn.setScale(1.1));
        btn.on('pointerout', () => btn.setScale(1));
        btn.on('pointerup', callback);
    }

    createWinButton(container, x, y, text, callback) {
        this.createMenuButton(container, x, y, text, callback);
    }

    showQuitConfirmation(pauseOverlay, pauseMenu) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Hide pause menu temporarily
        pauseMenu.setVisible(false);

        // Confirmation container
        const confirmContainer = this.add.container(width / 2, height / 2);
        confirmContainer.setDepth(200);

        // Background panel
        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 0.95);
        panel.fillRoundedRect(-140, -100, 280, 200, 20);
        confirmContainer.add(panel);

        // Warning icon
        const icon = this.add.text(0, -60, '⚠️', {
            fontSize: '36px'
        }).setOrigin(0.5);
        confirmContainer.add(icon);

        // Message
        const msg = this.add.text(0, -15, 'Quit this level?\nProgress will be lost.', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#333333',
            align: 'center'
        }).setOrigin(0.5);
        confirmContainer.add(msg);

        // Yes button
        const yesBtn = this.add.image(-60, 60, 'button').setScale(0.7).setInteractive({ useHandCursor: true });
        const yesTxt = this.add.text(-60, 60, 'Yes', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        confirmContainer.add(yesBtn);
        confirmContainer.add(yesTxt);

        yesBtn.on('pointerover', () => yesBtn.setScale(0.8));
        yesBtn.on('pointerout', () => yesBtn.setScale(0.7));
        yesBtn.on('pointerup', () => {
            this.scene.start('LevelSelectScene');
        });

        // No button
        const noBtn = this.add.image(60, 60, 'button').setScale(0.7).setInteractive({ useHandCursor: true });
        const noTxt = this.add.text(60, 60, 'No', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        confirmContainer.add(noBtn);
        confirmContainer.add(noTxt);

        noBtn.on('pointerover', () => noBtn.setScale(0.8));
        noBtn.on('pointerout', () => noBtn.setScale(0.7));
        noBtn.on('pointerup', () => {
            confirmContainer.destroy();
            pauseMenu.setVisible(true);
        });

        // Entrance animation
        confirmContainer.setScale(0.5);
        confirmContainer.setAlpha(0);
        this.tweens.add({
            targets: confirmContainer,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });
    }

    update(time, delta) {
        // Check for stuck board
        if (!this.isGameOver && !this.board.inputLocked) {
            if (!this.board.hasValidMoves()) {
                this.board.shuffle();
            }
        }

        // Watchdog for input lock
        if (this.board.inputLocked) {
            this.lockTimer = (this.lockTimer || 0) + delta;
            if (this.lockTimer > 5000) { // 5 seconds max lock time
                console.warn('Input lock watchdog triggered - forcing unlock');
                this.board.inputLocked = false;
                this.lockTimer = 0;
            }
        } else {
            this.lockTimer = 0;
        }
    }

    shutdown() {
        // Clean up event listeners to prevent memory leaks
        this.events.off('scoreUpdate');
        this.events.off('jellyCleared');
        this.events.off('jellyHit');
        this.events.off('lockBroken');
        this.events.off('validSwap');
        this.events.off('cascadeComplete');
        this.events.off('invalidSwap');
        this.events.off('candyCleared');
        this.events.off('shutdown');

        // Clean up hint timer
        if (this.hintTimer) {
            this.hintTimer.remove();
            this.hintTimer = null;
        }

        // Clean up progress bar tween
        if (this.progressTween) {
            this.progressTween.stop();
            this.progressTween = null;
        }

        // Clean up hint candies
        this.clearHint();

        // Clean up board
        if (this.board) {
            this.board.destroy();
        }
    }
}
