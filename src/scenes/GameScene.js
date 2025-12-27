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
            if (this.scoreText?.scene) this.scoreText.setText(`Score: ${this.score}`);

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

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(500);

        const container = this.add.container(width / 2, height / 2);
        container.setDepth(501);

        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 0.95);
        panel.fillRoundedRect(-180, -220, 360, 440, 25);
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

        if (this.currentLevel < 20) {
            this.createWinButton(container, 0, 100, 'Next Level', () => this.scene.restart({ level: this.currentLevel + 1 }));
        } else {
            this.createWinButton(container, 0, 100, 'Main Menu', () => this.scene.start('MenuScene'));
        }

        this.createWinButton(container, 0, 170, 'Replay', () => this.scene.restart({ level: this.currentLevel }));

        const menuBtn = this.add.text(0, 230, 'Level Select', {
            fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#666666'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        container.add(menuBtn);
        menuBtn.on('pointerup', () => this.scene.start('LevelSelectScene'));

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
        
        // Calculate cell size to fit the board within the screen with some padding
        const availableWidth = width * 0.95;
        const availableHeight = height * 0.75; 
        
        const sizeByWidth = availableWidth / cols;
        const sizeByHeight = availableHeight / rows;
        
        const cellSize = Math.floor(Math.min(sizeByWidth, sizeByHeight));
        
        // Center the board
        const boardWidth = cols * cellSize;
        const boardHeight = rows * cellSize;
        
        const x = (width - boardWidth) / 2;
        const y = 140 + (height - 140 - 80 - boardHeight) / 2;

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

        // Show BONUS text
        const bonusText = this.add.text(this.cameras.main.width / 2, 200, 'BONUS!', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '48px',
            color: '#ffeb3b',
            stroke: '#ff6b00',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: bonusText,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 500,
            yoyo: true,
            repeat: 1
        });

        await new Promise(r => setTimeout(r, 800));

        // Convert remaining moves to special candies (cap at 10)
        const specialTypes = ['line_h', 'line_v', 'bomb', 'color_bomb'];
        const movesToConvert = Math.min(this.movesRemaining, 10);

        for (let i = 0; i < movesToConvert; i++) {
            // Find a random non-special, non-locked candy
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

            // Pick a random candy and convert it
            const candy = candidates[Math.floor(Math.random() * candidates.length)];
            const specialType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
            candy.makeSpecial(specialType);

            // Visual feedback
            if (this.soundManager) this.soundManager.play('select');
            this.tweens.add({
                targets: candy,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 150,
                yoyo: true
            });

            // Update moves display
            this.movesRemaining--;
            if (this.movesText?.scene) this.movesText.setText(`Moves: ${this.movesRemaining}`);

            await new Promise(r => setTimeout(r, 200));
        }

        await new Promise(r => setTimeout(r, 500));
        bonusText.destroy();

        // Now activate all specials one by one
        let hasSpecials = true;
        while (hasSpecials) {
            // Find the first special candy
            let specialCandy = null;
            for (let r = 0; r < this.board.rows && !specialCandy; r++) {
                for (let c = 0; c < this.board.cols && !specialCandy; c++) {
                    const candy = this.board.candies[r][c];
                    if (candy && candy.active && candy.isSpecial) {
                        specialCandy = candy;
                    }
                }
            }

            if (!specialCandy) {
                hasSpecials = false;
                break;
            }

            // Activate the special
            if (this.soundManager) {
                this.soundManager.play(specialCandy.specialType === 'bomb' || specialCandy.specialType === 'color_bomb' ? 'bomb' : 'line');
            }

            await this.board.activateSpecial(specialCandy);
            await this.board.applyGravity();
            await this.board.fillEmptySpaces();
            await this.board.processCascades();

            await new Promise(r => setTimeout(r, 300));
        }
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
