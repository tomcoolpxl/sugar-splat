import Board from '../objects/Board.js';
import SoundManager from '../systems/SoundManager.js';
import { LevelData } from '../data/LevelData.js';
import { GameConfig } from '../Config.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.currentLevel = data.level || 1;
        this.score = 0;
        this.movesRemaining = 0;
        this.isGameOver = false;

        // Multi-objective state
        this.objectives = {
            score: 0,
            jelly: 0,
            collect: {}, // { type: count }
            drop: 0
        };

        this.status = {
            jelly: 0,
            collect: {},
            drop: 0
        };

        // Powerup system state
        this.powerups = { hammer: 0, bomb: 0, rowcol: 0, colorblast: 0 };
        this.powerupMode = null;  // null or powerup type when selecting target
        this.powerupButtons = {};
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Initialize Sound Manager
        this.soundManager = new SoundManager(this);
        
        // Apply saved mute state
        const soundOn = localStorage.getItem('sugarSplash_sound') !== 'false';
        this.sound.mute = !soundOn;

        this.soundManager.startMusic();

        // Load level data
        this.loadLevel(this.currentLevel);

        // Background
        this.createBackground(width, height);

        // Create the game board
        this.createBoard(width, height);

        // HUD
        this.createHUD(width, height);

        // Load and display powerups
        this.loadPowerups();
        this.createPowerupBar(width, height);

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
        const tutorial = this.levelConfig.tutorial;
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
        const level = LevelData[levelNum] || LevelData[1];
        this.levelConfig = level;
        this.movesRemaining = level.moves;
        
        // Reset objectives
        this.objectives = {
            score: level.targetScore || 0,
            jelly: 0,
            collect: level.collect || {},
            drop: level.drop || 0
        };

        this.status = {
            jelly: 0,
            collect: {},
            drop: 0
        };

        // Initialize collect status
        for (const type in this.objectives.collect) {
            this.status.collect[type] = 0;
        }

        // Calculate jelly target
        if (level.jelly) {
            this.objectives.jelly = level.jelly.reduce((sum, cell) => sum + (cell.layers || 1), 0);
        }
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

        // Multi-objective display
        this.createObjectivesDisplay(width);

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

        // Bottom bar - taller to fit powerups and score
        const bottomBar = this.add.graphics();
        bottomBar.fillStyle(0x000000, 0.3);
        bottomBar.fillRoundedRect(20, height - 90, width - 40, 75, 15);

        // Score display - positioned on the right side to leave room for powerups
        this.scoreText = this.add.text(width - 40, height - 52, `${this.score}`, {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '26px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(1, 0.5);

        // Score label
        this.add.text(width - 40, height - 75, 'Score', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#cccccc'
        }).setOrigin(1, 0.5);

        // Combo text (hidden by default) - positioned above the board
        this.comboText = this.add.text(width / 2, 155, '', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '42px',
            color: '#ffeb3b',
            stroke: '#ff6b9d',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0).setDepth(50);
    }

    createObjectivesDisplay(width) {
        // Simple display for multiple objectives
        const objectives = [];

        if (this.objectives.jelly > 0) {
            objectives.push(`🍮 ${this.objectives.jelly - this.status.jelly}`);
        }

        if (this.objectives.drop > 0) {
            objectives.push(`🍒 ${this.objectives.drop - this.status.drop}`);
        }

        for (const type in this.objectives.collect) {
            const icons = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];
            objectives.push(`${icons[type] || '🍬'} ${this.objectives.collect[type] - this.status.collect[type]}`);
        }

        // If no specific objectives, show score target
        if (objectives.length === 0 && this.objectives.score > 0) {
            objectives.push(`🎯 ${this.score} / ${this.objectives.score}`);
        }

        const text = objectives.join('   ');

        // Check if text object exists AND is still valid (has scene reference)
        if (this.objectiveText && this.objectiveText.scene) {
            this.objectiveText.setText(text);
        } else {
            this.objectiveText = this.add.text(width / 2, 80, text, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '26px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
        }
    }

    // --- Powerup System ---

    loadPowerups() {
        try {
            const saveData = localStorage.getItem('sugarSplash_save');
            if (saveData) {
                const parsed = JSON.parse(saveData);
                if (parsed.powerups) {
                    this.powerups = { ...this.powerups, ...parsed.powerups };
                }
            }
        } catch (e) {
            console.warn('Failed to load powerups:', e);
        }
    }

    savePowerups() {
        try {
            const saveKey = 'sugarSplash_save';
            let saveData = localStorage.getItem(saveKey);
            saveData = saveData ? JSON.parse(saveData) : { levels: {} };
            saveData.powerups = this.powerups;
            localStorage.setItem(saveKey, JSON.stringify(saveData));
        } catch (e) {
            console.warn('Failed to save powerups:', e);
        }
    }

    createPowerupBar(width, height) {
        const powerupTypes = ['hammer', 'bomb', 'rowcol', 'colorblast'];
        const barY = height - 52; // Centered in bottom bar
        const buttonSize = 48;
        const spacing = 10;
        const startX = 35;

        // Create powerup buttons
        powerupTypes.forEach((type, index) => {
            const x = startX + index * (buttonSize + spacing) + buttonSize / 2;
            const config = GameConfig.POWERUPS[type];

            // Button background
            const bg = this.add.graphics({ x, y: barY });
            bg.fillStyle(this.powerups[type] > 0 ? 0x4a4a6a : 0x2a2a3a, 0.9);
            bg.fillRoundedRect(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize, 8);
            bg.setInteractive(
                new Phaser.Geom.Rectangle(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize),
                Phaser.Geom.Rectangle.Contains
            );

            // Icon
            const icon = this.add.text(x, barY - 4, config.icon, {
                fontSize: '24px'
            }).setOrigin(0.5);

            // Count badge (bottom right corner)
            const count = this.add.text(x + 14, barY + 14, `${this.powerups[type]}`, {
                fontFamily: 'Arial Black',
                fontSize: '12px',
                color: this.powerups[type] > 0 ? '#ffffff' : '#666666',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            // Store references
            this.powerupButtons[type] = { bg, icon, count };

            // Click handler
            bg.on('pointerup', () => this.onPowerupClick(type));
            bg.on('pointerover', () => {
                if (this.powerups[type] > 0) {
                    this.tweens.add({ targets: [bg, icon], scaleX: 1.1, scaleY: 1.1, duration: 100 });
                }
            });
            bg.on('pointerout', () => {
                if (this.powerupMode !== type) {
                    this.tweens.add({ targets: [bg, icon], scaleX: 1, scaleY: 1, duration: 100 });
                }
            });
        });
    }

    onPowerupClick(type) {
        if (this.isGameOver || this.board.inputLocked) return;

        // Cancel if clicking same powerup
        if (this.powerupMode === type) {
            this.cancelPowerupMode();
            return;
        }

        // Check if player has this powerup
        if (this.powerups[type] <= 0) {
            // Flash red to indicate empty
            const btn = this.powerupButtons[type];
            if (btn) {
                this.tweens.add({
                    targets: btn.bg,
                    alpha: 0.5,
                    duration: 100,
                    yoyo: true,
                    repeat: 1
                });
            }
            return;
        }

        // Enter powerup mode
        this.powerupMode = type;
        if (this.soundManager) this.soundManager.play('select');

        // Highlight selected button
        const btn = this.powerupButtons[type];
        if (btn) {
            this.tweens.add({ targets: [btn.bg, btn.icon], scaleX: 1.15, scaleY: 1.15, duration: 150 });
        }

        // Dim the board slightly
        if (!this.powerupOverlay) {
            this.powerupOverlay = this.add.graphics();
        }
        this.powerupOverlay.clear();
        this.powerupOverlay.fillStyle(0x000000, 0.2);
        this.powerupOverlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.powerupOverlay.setDepth(5);

        // Show cancel hint
        this.showPowerupHint(type);
    }

    showPowerupHint(type) {
        const config = GameConfig.POWERUPS[type];
        if (this.powerupHintText?.scene) {
            this.powerupHintText.destroy();
        }
        this.powerupHintText = this.add.text(
            this.cameras.main.width / 2,
            160,
            `Tap a candy to use ${config.name}`,
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '20px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setDepth(10);
    }

    cancelPowerupMode() {
        if (!this.powerupMode) return;

        const btn = this.powerupButtons[this.powerupMode];
        if (btn) {
            this.tweens.add({ targets: [btn.bg, btn.icon], scaleX: 1, scaleY: 1, duration: 150 });
        }

        this.powerupMode = null;

        if (this.powerupOverlay) {
            this.powerupOverlay.clear();
        }

        if (this.powerupHintText?.scene) {
            this.powerupHintText.destroy();
            this.powerupHintText = null;
        }
    }

    updatePowerupButton(type) {
        const btn = this.powerupButtons[type];
        if (!btn) return;

        // Update count
        btn.count.setText(`${this.powerups[type]}`);
        btn.count.setColor(this.powerups[type] > 0 ? '#ffffff' : '#666666');

        // Update background (48x48 buttons)
        btn.bg.clear();
        btn.bg.fillStyle(this.powerups[type] > 0 ? 0x4a4a6a : 0x2a2a3a, 0.9);
        btn.bg.fillRoundedRect(-24, -24, 48, 48, 8);
    }

    async activatePowerup(type, row, col, candy) {
        // Use up the powerup
        this.powerups[type]--;
        this.updatePowerupButton(type);
        this.savePowerups();
        this.cancelPowerupMode();

        // Lock input during activation
        this.board.inputLocked = true;

        try {
            switch (type) {
                case 'hammer':
                    await this.activateHammer(row, col, candy);
                    break;
                case 'bomb':
                    await this.activateBombPowerup(row, col);
                    break;
                case 'rowcol':
                    await this.activateRowCol(row, col);
                    break;
                case 'colorblast':
                    await this.activateColorBlast(row, col, candy);
                    break;
            }

            // Process any cascades
            await this.board.applyGravity();
            await this.board.fillEmptySpaces();
            await this.board.processCascades();
            this.events.emit('cascadeComplete');
        } finally {
            this.board.inputLocked = false;
        }
    }

    async activateHammer(row, col, candy) {
        if (!candy || !candy.active) return;

        // Hammer animation
        const pos = this.board.gridToWorld(row, col);

        // Show hammer icon slamming down
        const hammer = this.add.text(pos.x, pos.y - 60, '🔨', { fontSize: '48px' }).setOrigin(0.5).setDepth(100);

        await new Promise(resolve => {
            this.tweens.add({
                targets: hammer,
                y: pos.y,
                rotation: 0.3,
                duration: 200,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    this.cameras.main.shake(100, 0.01);
                    if (this.soundManager) this.soundManager.play('bomb');

                    // Particles
                    if (this.emitter) {
                        this.emitter.setConfig({
                            speed: { min: 100, max: 200 },
                            scale: { start: 0.5, end: 0 },
                            lifespan: 400,
                            tint: candy.tint || 0xffffff
                        });
                        this.emitter.emitParticleAt(pos.x, pos.y, 15);
                    }

                    hammer.destroy();
                    resolve();
                }
            });
        });

        // Clear the candy and handle jelly
        this.board.handleJellyAt(row, col);
        await this.board.clearCandies([{ row, col }]);
    }

    async activateBombPowerup(row, col) {
        const pos = this.board.gridToWorld(row, col);

        // Show bomb explosion effect
        const ring = this.add.graphics({ x: pos.x, y: pos.y });
        ring.fillStyle(0xff6600, 0.7);
        ring.fillCircle(0, 0, this.board.cellSize);

        this.cameras.main.shake(200, 0.015);
        if (this.soundManager) this.soundManager.play('bomb');

        await new Promise(resolve => {
            this.tweens.add({
                targets: ring,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    ring.destroy();
                    resolve();
                }
            });
        });

        // Clear 3x3 area
        const cells = [];
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (this.board.isValidCell(r, c) && this.board.candies[r][c]) {
                    this.board.handleJellyAt(r, c);
                    cells.push({ row: r, col: c });
                }
            }
        }

        const score = this.board.calculateScore(cells.length, 1);
        this.events.emit('scoreUpdate', score, 1);
        await this.board.clearCandies(cells);
    }

    async activateRowCol(row, col) {
        const pos = this.board.gridToWorld(row, col);
        const cells = [];

        // Clear both row and column for maximum effect
        // Row
        for (let c = 0; c < this.board.cols; c++) {
            if (this.board.candies[row][c]) {
                this.board.handleJellyAt(row, c);
                cells.push({ row, col: c });
            }
        }
        // Column (avoid duplicating center)
        for (let r = 0; r < this.board.rows; r++) {
            if (r !== row && this.board.candies[r][col]) {
                this.board.handleJellyAt(r, col);
                cells.push({ row: r, col });
            }
        }

        // Cross effect visual
        const h = this.add.graphics()
            .fillStyle(0xffff00, 0.8)
            .fillRect(this.board.x, pos.y - 15, this.board.cols * this.board.cellSize, 30);
        const v = this.add.graphics()
            .fillStyle(0xffff00, 0.8)
            .fillRect(pos.x - 15, this.board.y, 30, this.board.rows * this.board.cellSize);

        if (this.soundManager) this.soundManager.play('line');

        await new Promise(resolve => {
            this.tweens.add({
                targets: [h, v],
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    h.destroy();
                    v.destroy();
                    resolve();
                }
            });
        });

        const score = this.board.calculateScore(cells.length, 1);
        this.events.emit('scoreUpdate', score, 1);
        await this.board.clearCandies(cells);
    }

    async activateColorBlast(row, col, candy) {
        if (!candy) return;

        const targetType = candy.candyType;
        const cells = [];

        // Find all candies of this color
        for (let r = 0; r < this.board.rows; r++) {
            for (let c = 0; c < this.board.cols; c++) {
                const cell = this.board.candies[r][c];
                if (cell && cell.candyType === targetType) {
                    this.board.handleJellyAt(r, c);
                    cells.push({ row: r, col: c });
                }
            }
        }

        // Rainbow effect - particles from each candy
        const centerPos = this.board.gridToWorld(row, col);
        const colors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff];

        for (const cell of cells) {
            const pos = this.board.gridToWorld(cell.row, cell.col);
            if (this.emitter) {
                this.emitter.setConfig({
                    speed: { min: 50, max: 150 },
                    scale: { start: 0.4, end: 0 },
                    lifespan: 500,
                    tint: colors[Math.floor(Math.random() * colors.length)]
                });
                this.emitter.emitParticleAt(pos.x, pos.y, 5);
            }
        }

        if (this.soundManager) this.soundManager.play('bomb');
        this.cameras.main.shake(150, 0.01);

        await new Promise(r => setTimeout(r, 200));

        const score = this.board.calculateScore(cells.length, 1) + 100;
        this.events.emit('scoreUpdate', score, 1);
        await this.board.clearCandies(cells);
    }

    updateProgressBar() {
        const width = this.cameras.main.width;
        const progressBarWidth = width - 100;
        const progressBarX = 50;
        const progressBarY = 115;

        let targetProgress = 0;
        let color = 0x4ade80; // Default green

        // Calculate aggregate progress of all objectives
        let totalGoals = 0;
        let totalCurrent = 0;

        if (this.objectives.jelly > 0) {
            totalGoals += this.objectives.jelly;
            totalCurrent += this.status.jelly;
            color = 0xff69b4;
        }
        
        if (this.objectives.drop > 0) {
            totalGoals += this.objectives.drop;
            totalCurrent += this.status.drop;
            color = 0xd63031;
        }

        for (const type in this.objectives.collect) {
            totalGoals += this.objectives.collect[type];
            totalCurrent += this.status.collect[type];
        }

        if (totalGoals > 0) {
            targetProgress = Math.min(totalCurrent / totalGoals, 1);
        } else if (this.objectives.score > 0) {
            targetProgress = Math.min(this.score / this.objectives.score, 1);
        }

        // Kill any existing progress tween
        if (this.progressTween) {
            this.progressTween.stop();
        }

        this.progressBarColor = color;

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
            if (this.scoreText?.scene) this.scoreText.setText(`${this.score}`);

            // Play sound
            if (this.soundManager) this.soundManager.play(cascadeLevel > 1 ? 'cascade' : 'match');

            this.createObjectivesDisplay(this.cameras.main.width);
            this.updateProgressBar();

            // Show combo text for cascades
            if (cascadeLevel > 1) {
                this.showCombo(cascadeLevel);
            }

            // Reset hint timer
            this.resetHintTimer();
        });

        // Special activated event
        this.events.on('specialActivated', (type, row, col) => {
            if (this.soundManager) this.soundManager.play(type === 'bomb' || type === 'color_bomb' ? 'bomb' : 'line');
            
            // Screen shake based on type
            if (type === 'bomb' || type === 'color_bomb') {
                this.cameras.main.shake(200, 0.015);
            } else {
                this.cameras.main.shake(100, 0.005);
            }

            // Emit some extra particles at the activation point
            this.emitSpecialParticles(row, col, type);
        });

        // Jelly cleared event
        this.events.on('jellyCleared', (row, col) => {
            this.status.jelly++;
            if (this.soundManager) this.soundManager.play('line');
            this.createObjectivesDisplay(this.cameras.main.width);
            this.updateProgressBar();

            // Jelly-specific particles
            this.emitJellyParticles(row, col);

            // Animate objective text
            if (this.objectiveText?.scene) {
                this.tweens.add({
                    targets: this.objectiveText,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 100,
                    yoyo: true
                });
            }
        });

        // Jelly hit (double->single) event
        this.events.on('jellyHit', (row, col) => {
            this.status.jelly++;
            if (this.soundManager) this.soundManager.play('click');
            this.createObjectivesDisplay(this.cameras.main.width);
            this.updateProgressBar();
        });

        // Lock broken event
        this.events.on('lockBroken', (row, col) => {
            if (this.soundManager) this.soundManager.play('line');
            // Visual feedback - screen flash
            this.cameras.main.flash(100, 135, 206, 235, false);
        });

        // Valid swap - decrement moves
        this.events.on('validSwap', () => {
            if (this.soundManager) this.soundManager.play('swap');
            this.movesRemaining--;
            if (this.movesText?.scene) this.movesText.setText(`Moves: ${this.movesRemaining}`);

            // Animate moves text when low
            if (this.movesRemaining <= 5 && this.movesText?.scene) {
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

            if (this.checkWinCondition()) {
                this.showWinScreen();
                return;
            }

            // Check lose condition
            if (this.movesRemaining <= 0) {
                this.showLoseScreen();
            }
        });

        // Invalid swap feedback
        this.events.on('invalidSwap', () => {
            if (this.soundManager) this.soundManager.play('invalid');
            this.resetHintTimer();
        });

        // Candy cleared
        this.events.on('candyCleared', (row, col, type) => {
            this.emitParticles(row, col, type);
            
            // Check for collect objective
            if (this.objectives.collect[type] !== undefined) {
                this.status.collect[type]++;
                this.createObjectivesDisplay(this.cameras.main.width);
                this.updateProgressBar();
            }

            // Check for ingredient collect (type >= 100)
            if (type >= 100) {
                this.status.drop++;
                if (this.soundManager) this.soundManager.play('win'); // special sound for ingredient
                this.createObjectivesDisplay(this.cameras.main.width);
                this.updateProgressBar();
            }
        });
    }

    checkWinCondition() {
        if (this.isGameOver) return false;

        // Check score
        if (this.objectives.score > 0 && this.score < this.objectives.score) return false;

        // Check jelly
        if (this.status.jelly < this.objectives.jelly) return false;

        // Check drop items
        if (this.status.drop < this.objectives.drop) return false;

        // Check collect candies
        for (const type in this.objectives.collect) {
            if ((this.status.collect[type] || 0) < this.objectives.collect[type]) return false;
        }

        return true;
    }

    showLoseScreen() {
        this.isGameOver = true;
        if (this.soundManager) this.soundManager.play('levelFail');
        this.board.inputLocked = true;
        this.clearHint();

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(500);

        // Lose container
        const container = this.add.container(width / 2, height / 2);
        container.setDepth(501);

        // Background panel
        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 0.95);
        panel.fillRoundedRect(-180, -180, 360, 360, 25);
        container.add(panel);

        // Title
        const title = this.add.text(0, -130, 'Out of Moves!', {
            fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '36px', color: '#ff4757'
        }).setOrigin(0.5);
        container.add(title);

        // Status
        const statusText = this.add.text(0, -40, 'Objective not met.', {
            fontFamily: 'Arial, sans-serif', fontSize: '24px', color: '#333333'
        }).setOrigin(0.5);
        container.add(statusText);

        // Try again button
        this.createWinButton(container, 0, 60, 'Try Again', () => {
            this.scene.restart({ level: this.currentLevel });
        });

        // Level select button
        const menuBtn = this.add.text(0, 140, 'Level Select', {
            fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#666666'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        container.add(menuBtn);

        menuBtn.on('pointerup', () => this.scene.start('LevelSelectScene'));

        // Entrance animation
        container.setScale(0.5);
        container.setAlpha(0);
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, alpha: 1, duration: 400, ease: 'Back.easeOut' });
    }

    async showWinScreen() {
        this.isGameOver = true;
        this.board.inputLocked = true;
        this.clearHint();

        // Play Bonus Round if moves remaining
        if (this.movesRemaining > 0) {
            await this.playBonusRound();
        }

        if (this.soundManager) this.soundManager.play('win');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Calculate stars (simple version)
        let stars = 1;
        if (this.movesRemaining > 5) stars = 2;
        if (this.movesRemaining > 10) stars = 3;

        this.saveProgress(stars);

        // Award powerups based on stars
        const awardedPowerups = this.awardPowerups(stars);

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(500);

        const container = this.add.container(width / 2, height / 2);
        container.setDepth(501);

        // Adjust panel size if we have powerup rewards
        const panelHeight = awardedPowerups.length > 0 ? 500 : 440;
        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 0.95);
        panel.fillRoundedRect(-180, -220, 360, panelHeight, 25);
        container.add(panel);

        const title = this.add.text(0, -170, 'Level Complete!', {
            fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '36px', color: '#4ade80'
        }).setOrigin(0.5);
        container.add(title);

        for (let i = 0; i < 3; i++) {
            const star = this.add.image(-60 + i * 60, -90, i < stars ? 'star_filled' : 'star_empty');
            star.setScale(0);
            container.add(star);
            this.tweens.add({ targets: star, scaleX: 1.5, scaleY: 1.5, duration: 300, delay: 200 + i * 200, ease: 'Back.easeOut' });
        }

        const scoreText = this.add.text(0, -10, `Score: ${this.score}`, {
            fontFamily: 'Arial, sans-serif', fontSize: '28px', color: '#333333'
        }).setOrigin(0.5);
        container.add(scoreText);

        // Display powerup rewards
        if (awardedPowerups.length > 0) {
            const rewardLabel = this.add.text(0, 35, 'Rewards:', {
                fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#666666'
            }).setOrigin(0.5);
            container.add(rewardLabel);

            const spacing = 60;
            const startX = -((awardedPowerups.length - 1) * spacing) / 2;

            awardedPowerups.forEach((type, index) => {
                const config = GameConfig.POWERUPS[type];
                const rewardIcon = this.add.text(startX + index * spacing, 70, config.icon, {
                    fontSize: '36px'
                }).setOrigin(0.5).setScale(0);
                container.add(rewardIcon);

                // Animated entrance with bounce
                this.tweens.add({
                    targets: rewardIcon,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 400,
                    delay: 800 + index * 200,
                    ease: 'Back.easeOut',
                    onStart: () => {
                        if (this.soundManager) this.soundManager.play('select');
                    }
                });

                // "+1" text
                const plusOne = this.add.text(startX + index * spacing + 20, 50, '+1', {
                    fontFamily: 'Arial Black',
                    fontSize: '16px',
                    color: '#4ade80',
                    stroke: '#ffffff',
                    strokeThickness: 2
                }).setOrigin(0.5).setAlpha(0);
                container.add(plusOne);

                this.tweens.add({
                    targets: plusOne,
                    alpha: 1,
                    y: 40,
                    duration: 300,
                    delay: 900 + index * 200,
                    ease: 'Power2'
                });
            });
        }

        // Adjust button positions based on whether we have rewards
        const buttonStartY = awardedPowerups.length > 0 ? 120 : 80;
        const buttonSpacing = 55;

        if (this.currentLevel < 20) {
            this.createWinButton(container, 0, buttonStartY, 'Next Level', () => this.scene.restart({ level: this.currentLevel + 1 }));
        } else {
            this.createWinButton(container, 0, buttonStartY, 'Main Menu', () => this.scene.start('MenuScene'));
        }

        this.createWinButton(container, 0, buttonStartY + buttonSpacing, 'Replay', () => this.scene.restart({ level: this.currentLevel }));
        this.createWinButton(container, 0, buttonStartY + buttonSpacing * 2, 'Level Select', () => this.scene.start('LevelSelectScene'));

        container.setScale(0.5); container.setAlpha(0);
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, alpha: 1, duration: 400, ease: 'Back.easeOut' });
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

    // Award powerups based on stars earned
    awardPowerups(stars) {
        const awarded = [];

        // 1 star: 30% chance of 1 powerup
        // 2 stars: 1 random powerup guaranteed
        // 3 stars: 1 random powerup + 50% chance of second
        if (stars === 1) {
            if (Math.random() < 0.3) {
                awarded.push(this.selectRandomPowerup());
            }
        } else if (stars === 2) {
            awarded.push(this.selectRandomPowerup());
        } else if (stars >= 3) {
            awarded.push(this.selectRandomPowerup());
            if (Math.random() < 0.5) {
                awarded.push(this.selectRandomPowerup());
            }
        }

        // Add to inventory
        for (const type of awarded) {
            this.powerups[type]++;
            this.updatePowerupButton(type);
        }
        this.savePowerups();

        return awarded;
    }

    // Weighted random powerup selection
    selectRandomPowerup() {
        const powerupConfig = GameConfig.POWERUPS;
        const types = Object.keys(powerupConfig);
        const totalWeight = types.reduce((sum, type) => sum + (powerupConfig[type].weight || 25), 0);

        let rand = Math.random() * totalWeight;
        for (const type of types) {
            rand -= (powerupConfig[type].weight || 25);
            if (rand <= 0) return type;
        }
        return types[0]; // Fallback to first type
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
        // Watchdog for input lock - last resort safety net
        // ActionProcessor now handles errors properly, so this should rarely trigger
        if (this.board && this.board.inputLocked && !this.isGameOver) {
            this.lockTimer = (this.lockTimer || 0) + delta;
            if (this.lockTimer > 10000) { // 10 seconds - extended timeout as backup only
                console.warn('Input lock watchdog triggered after 10s - forcing unlock (this indicates a bug)');
                this.board.inputLocked = false;
                if (this.board.actionProcessor) {
                    this.board.actionProcessor.isProcessing = false;
                }
                this.lockTimer = 0;
            }
        } else {
            this.lockTimer = 0;
        }
    }

    createBoard(width, height) {
        const cols = GameConfig.BOARD.COLS;
        const rows = GameConfig.BOARD.ROWS;

        // Layout constants
        const topBarHeight = 140;
        const bottomBarHeight = 95; // Taller bottom bar for powerups + score

        // Calculate cell size to fit the board within the screen with some padding
        const availableWidth = width * 0.95;
        const availableHeight = height - topBarHeight - bottomBarHeight - 20; // 20px padding

        const sizeByWidth = availableWidth / cols;
        const sizeByHeight = availableHeight / rows;

        const cellSize = Math.floor(Math.min(sizeByWidth, sizeByHeight));

        // Center the board
        const boardWidth = cols * cellSize;
        const boardHeight = rows * cellSize;

        const x = (width - boardWidth) / 2;
        const y = topBarHeight + (height - topBarHeight - bottomBarHeight - boardHeight) / 2;

        this.board = new Board(this, {
            rows: rows,
            cols: cols,
            x: x,
            y: y,
            cellSize: cellSize,
            candyTypes: 6,
            levelConfig: this.levelConfig
        });
    }

    createParticles() {
        this.emitter = this.add.particles(0, 0, 'star_filled', {
            speed: { min: 50, max: 200 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            blendMode: 'ADD',
            emitting: false
        });
        this.emitter.setDepth(100);
    }

    emitParticles(row, col, type) {
        if (!this.board || !this.emitter) return;
        const pos = this.board.gridToWorld(row, col);

        const colors = GameConfig.COLORS;
        const color = colors[type] || 0xffffff;

        this.emitter.setConfig({
            tint: color,
            speed: { min: 80, max: 250 },
            scale: { start: 0.6, end: 0 },
            lifespan: 500,
            angle: { min: 0, max: 360 }
        });

        this.emitter.emitParticleAt(pos.x, pos.y, 12);
    }

    emitJellyParticles(row, col) {
        if (!this.board || !this.emitter) return;
        const pos = this.board.gridToWorld(row, col);

        // Pink/magenta burst for jelly
        this.emitter.setConfig({
            tint: 0xff69b4,
            speed: { min: 100, max: 300 },
            scale: { start: 0.8, end: 0 },
            lifespan: 700,
            angle: { min: 0, max: 360 },
            alpha: { start: 1, end: 0.3 }
        });

        this.emitter.emitParticleAt(pos.x, pos.y, 20);
    }

    emitSpecialParticles(row, col, type) {
        if (!this.board || !this.emitter) return;
        const pos = this.board.gridToWorld(row, col);

        // Different effects based on special type
        let config = {
            tint: 0xffffff,
            speed: 300,
            scale: { start: 1, end: 0 },
            lifespan: 600
        };

        if (type === 'bomb' || type === 'color_bomb') {
            config = {
                tint: 0xffaa00,
                speed: { min: 200, max: 400 },
                scale: { start: 1.2, end: 0 },
                lifespan: 800,
                angle: { min: 0, max: 360 }
            };
        } else if (type === 'line_h' || type === 'line_v') {
            config = {
                tint: 0x00ffff,
                speed: { min: 150, max: 350 },
                scale: { start: 0.8, end: 0 },
                lifespan: 500
            };
        }

        this.emitter.setConfig(config);
        this.emitter.emitParticleAt(pos.x, pos.y, type === 'color_bomb' ? 50 : 30);
    }

    setupHintSystem() {
        this.hintTimer = this.time.addEvent({
            delay: 5000,
            callback: this.showHint,
            callbackScope: this,
            loop: true
        });
        
        this.input.on('pointerdown', () => this.resetHintTimer());
    }

    resetHintTimer() {
        if (this.hintTimer) {
            this.hintTimer.reset({
                delay: 5000,
                callback: this.showHint,
                callbackScope: this,
                loop: true
            });
        }
        this.clearHint();
    }

    clearHint() {
        if (this.hintHand) {
            this.hintHand.destroy();
            this.hintHand = null;
        }
        if (this.hintGlow) {
            this.hintGlow.destroy();
            this.hintGlow = null;
        }
    }

    showHint() {
        if (this.isGameOver || this.board.inputLocked) return;
        
        const move = this.board.findValidMove();
        if (move && move.length > 0) {
            const targetCell = move[0];
            const candy = this.board.candies[targetCell.row][targetCell.col];
            if (!candy) return;
            
            this.clearHint();
            
            this.hintGlow = this.add.image(candy.x, candy.y, 'glow');
            this.hintGlow.setDepth(10);
            this.hintGlow.setAlpha(0.5);
            this.tweens.add({
                targets: this.hintGlow,
                alpha: 1,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 800,
                yoyo: true,
                repeat: -1
            });
            
            // Also show the hand cursor indicating the swap direction
            const destCell = move[1];
            const destCandy = this.board.candies[destCell.row][destCell.col];
            if (destCandy) {
                this.hintHand = this.add.image(candy.x, candy.y, 'arrow'); // Using arrow instead of hand for now
                this.hintHand.setDepth(11);
                this.hintHand.setOrigin(0, 0.5);
                
                // Rotate arrow to point towards destination
                const angle = Phaser.Math.Angle.Between(candy.x, candy.y, destCandy.x, destCandy.y);
                this.hintHand.setRotation(angle);
                
                this.tweens.add({
                    targets: this.hintHand,
                    x: (candy.x + destCandy.x) / 2,
                    y: (candy.y + destCandy.y) / 2,
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
            }
        }
    }

    async playBonusRound() {
        if (this.movesRemaining <= 0) return;

        // --- PHASE 0: Setup ---
        const bonusScoreStart = this.score;
        this.board.inputLocked = true;

        // Show BONUS text with entrance animation
        const bonusText = this.add.text(this.cameras.main.width / 2, 180, 'BONUS!', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '52px',
            color: '#ffeb3b',
            stroke: '#ff6b00',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(100).setScale(0);

        this.tweens.add({
            targets: bonusText,
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });

        // Live bonus counter
        const bonusCounter = this.add.text(this.cameras.main.width / 2, 230, 'Bonus: +0', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#333333',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(100).setAlpha(0);

        this.tweens.add({
            targets: bonusCounter,
            alpha: 1,
            duration: 300,
            delay: 300
        });

        await new Promise(r => setTimeout(r, 800));

        // --- PHASE 1: Convert moves to specials (weighted selection) ---
        const specialWeights = { line_h: 30, line_v: 30, bomb: 35, color_bomb: 5 };
        const movesToConvert = Math.min(this.movesRemaining, 10);

        // Rising pitch scale for conversion sounds (C major scale)
        const pitchMultipliers = [1, 1.125, 1.25, 1.333, 1.5, 1.667, 1.875, 2, 2.25, 2.5];

        for (let i = 0; i < movesToConvert; i++) {
            // Find random normal candy
            const candidates = [];
            for (let r = 0; r < this.board.rows; r++) {
                for (let c = 0; c < this.board.cols; c++) {
                    const candy = this.board.candies[r][c];
                    if (candy && candy.active && !candy.isSpecial && !candy.isIngredient && !this.board.locked[r][c]) {
                        candidates.push(candy);
                    }
                }
            }

            if (candidates.length === 0) break;

            // Pick random candy and weighted random special type
            const candy = candidates[Math.floor(Math.random() * candidates.length)];
            const specialType = this.weightedRandomSpecial(specialWeights);
            candy.makeSpecial(specialType);

            // Sparkle particle effect at conversion
            if (this.emitter) {
                const pos = this.board.gridToWorld(candy.row, candy.col);
                this.emitter.setConfig({
                    speed: { min: 50, max: 150 },
                    scale: { start: 0.4, end: 0 },
                    lifespan: 400,
                    tint: 0xffff00
                });
                this.emitter.emitParticleAt(pos.x, pos.y, 8);
            }

            // Sound with rising pitch
            if (this.soundManager) this.soundManager.play('select');

            // Animate moves counter
            this.movesRemaining--;
            if (this.movesText?.scene) {
                this.movesText.setText(`Moves: ${this.movesRemaining}`);
                this.tweens.add({
                    targets: this.movesText,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 100,
                    yoyo: true
                });
            }

            await new Promise(r => setTimeout(r, 220));
        }

        await new Promise(r => setTimeout(r, 400));
        bonusText.destroy();

        // --- PHASE 2: Activate specials one by one until none remain ---
        // Keep looping because activating specials can create new ones
        let safetyCounter = 0;
        const maxIterations = 50; // Prevent infinite loops

        while (safetyCounter < maxIterations) {
            const allSpecials = this.getAllSpecialsOnBoard();
            if (allSpecials.length === 0) break;

            this.shuffleArray(allSpecials);
            safetyCounter++;

            for (const special of allSpecials) {
                if (!special.active) continue;

                // Highlight effect - flash before activation
                this.tweens.add({
                    targets: special,
                    alpha: 0.3,
                    duration: 100,
                    yoyo: true,
                    repeat: 2
                });
                await new Promise(r => setTimeout(r, 300));

                // Play activation sound
                if (this.soundManager) {
                    this.soundManager.play(special.specialType === 'bomb' || special.specialType === 'color_bomb' ? 'bomb' : 'line');
                }

                // Activate and wait for cascades
                await this.board.activateSpecial(special);
                await this.board.applyGravity();
                await this.board.fillEmptySpaces();
                await this.board.processCascades();

                // Update live bonus counter
                const currentBonus = this.score - bonusScoreStart;
                if (bonusCounter?.scene) {
                    bonusCounter.setText(`Bonus: +${currentBonus}`);
                    this.tweens.add({
                        targets: bonusCounter,
                        scaleX: 1.15,
                        scaleY: 1.15,
                        duration: 100,
                        yoyo: true
                    });
                }

                await new Promise(r => setTimeout(r, 250));
            }
        }

        // --- PHASE 3: Grand Finale ---
        const totalBonus = this.score - bonusScoreStart;

        // Final bonus display
        if (bonusCounter?.scene) {
            bonusCounter.setText(`Bonus: +${totalBonus}`);
            this.tweens.add({
                targets: bonusCounter,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 300,
                ease: 'Back.easeOut'
            });
        }

        // Confetti burst!
        await this.showConfetti();

        await new Promise(r => setTimeout(r, 800));
        if (bonusCounter?.scene) bonusCounter.destroy();
    }

    // Helper: Weighted random special selection
    weightedRandomSpecial(weights) {
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let rand = Math.random() * total;
        for (const [type, weight] of Object.entries(weights)) {
            rand -= weight;
            if (rand <= 0) return type;
        }
        return 'bomb';
    }

    // Helper: Get all special candies on board
    getAllSpecialsOnBoard() {
        const specials = [];
        for (let r = 0; r < this.board.rows; r++) {
            for (let c = 0; c < this.board.cols; c++) {
                const candy = this.board.candies[r][c];
                if (candy && candy.active && candy.isSpecial) {
                    specials.push(candy);
                }
            }
        }
        return specials;
    }

    // Helper: Fisher-Yates shuffle
    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Helper: Confetti particle burst
    async showConfetti() {
        const width = this.cameras.main.width;
        const colors = [0xff4757, 0x3742fa, 0x2ed573, 0xffa502, 0xa55eea, 0xff7f50, 0xffeb3b];

        // Create multiple confetti bursts
        for (let burst = 0; burst < 3; burst++) {
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * width;
                const color = colors[Math.floor(Math.random() * colors.length)];

                const confetti = this.add.graphics({ x, y: -20 });
                confetti.fillStyle(color, 1);
                confetti.fillRect(-4, -4, 8, 8);
                confetti.setDepth(150);

                this.tweens.add({
                    targets: confetti,
                    y: this.cameras.main.height + 50,
                    x: x + (Math.random() - 0.5) * 200,
                    rotation: Math.random() * 10,
                    duration: 1500 + Math.random() * 1000,
                    ease: 'Quad.easeIn',
                    delay: burst * 200 + Math.random() * 100,
                    onComplete: () => confetti.destroy()
                });
            }

            if (this.soundManager && burst === 0) this.soundManager.play('win');
        }

        // Camera shake for impact
        this.cameras.main.shake(300, 0.01);

        await new Promise(r => setTimeout(r, 1000));
    }

    showCombo(combo) {
        if (!this.comboText?.scene) return;

        this.comboText.setText(`${combo}x COMBO!`);
        this.comboText.setAlpha(1);
        this.comboText.setScale(0.5);
        this.comboText.y = 155;
        
        this.tweens.add({
            targets: this.comboText,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0,
            y: 100,
            duration: 1000,
            ease: 'Power2'
        });
    }

    shutdown() {
        // Stop music first and destroy sound manager
        if (this.soundManager) {
            this.soundManager.destroy();
            this.soundManager = null;
        }

        // Clean up event listeners to prevent memory leaks
        this.events.off('scoreUpdate');
        this.events.off('jellyCleared');
        this.events.off('jellyHit');
        this.events.off('lockBroken');
        this.events.off('validSwap');
        this.events.off('cascadeComplete');
        this.events.off('invalidSwap');
        this.events.off('candyCleared');
        this.events.off('specialActivated');
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
            this.board = null;
        }

        // Null out all UI references to prevent stale object errors on restart
        this.objectiveText = null;
        this.movesText = null;
        this.scoreText = null;
        this.comboText = null;
        this.progressBar = null;
        this.progressBarBg = null;
        this.emitter = null;
    }
}
