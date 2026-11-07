import { GameConfig } from '../Config.js';

/**
 * DialogManager - Handles modal dialogs and overlays
 * Provides reusable dialog patterns for win/lose/pause screens
 */
export default class DialogManager {
    constructor(scene) {
        this.scene = scene;
        this.currentOverlay = null;
        this.currentContainer = null;
    }

    // --- Core Dialog Creation ---

    createOverlay(depth = 500) {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(depth);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

        this.currentOverlay = overlay;
        return overlay;
    }

    createContainer(depth = 501) {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        const container = this.scene.add.container(width / 2, height / 2);
        container.setDepth(depth);

        this.currentContainer = container;
        return container;
    }

    createPanel(container, width, height, radius = 25) {
        const panel = this.scene.add.graphics();
        panel.fillStyle(0xffffff, 0.95);
        panel.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
        container.add(panel);
        return panel;
    }

    createButton(container, x, y, text, callback, scale = 1) {
        const btn = this.scene.add.image(x, y, 'button').setScale(scale).setInteractive({ useHandCursor: true });
        const btnText = this.scene.add.text(x, y, text, {
            fontFamily: GameConfig.UI.FONT_FAMILY,
            fontSize: scale <= 0.65 ? '18px' : scale < 0.85 ? '20px' : '23px',
            color: '#ffffff'
        }).setOrigin(0.5);

        container.add(btn);
        container.add(btnText);

        btn.on('pointerover', () => {
            btn.setScale(scale * 1.05);
            btnText.setScale(1.05);
        });
        btn.on('pointerout', () => {
            btn.setScale(scale);
            btnText.setScale(1);
        });
        btn.on('pointerup', callback);

        return { btn, btnText };
    }

    animateIn(container, duration = 400) {
        container.setScale(0.5);
        container.setAlpha(0);
        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                duration,
                ease: 'Back.easeOut',
                onComplete: resolve
            });
        });
    }

    // --- Pre-built Dialogs ---

    showTutorial(tutorial, onDismiss) {
        if (!tutorial) return;

        const seenKey = `sugarSplash_tutorial_${this.scene.currentLevel}`;
        if (localStorage.getItem(seenKey)) return;

        const overlay = this.createOverlay(100);
        const container = this.createContainer(101);

        this.createPanel(container, 340, 300, 20);

        // Icon
        const icon = this.scene.add.text(0, -100, tutorial.icon, { fontSize: '48px' }).setOrigin(0.5);
        container.add(icon);

        // Title
        const title = this.scene.add.text(0, -45, tutorial.title, {
            fontFamily: GameConfig.UI.FONT_FAMILY,
            fontSize: '26px',
            color: '#ff6b9d'
        }).setOrigin(0.5);
        container.add(title);

        // Description - with word wrap
        const desc = this.scene.add.text(0, 20, tutorial.text, {
            fontFamily: GameConfig.UI.FONT_FAMILY_BODY,
            fontSize: '18px',
            color: '#333333',
            align: 'center',
            wordWrap: { width: 300 },
            lineSpacing: 4
        }).setOrigin(0.5);
        container.add(desc);

        // Got it button
        this.createButton(container, 0, 115, 'Got it!', () => {
            localStorage.setItem(seenKey, 'true');
            overlay.destroy();
            container.destroy();
            if (onDismiss) onDismiss();
        });

        this.animateIn(container, 300);
    }

    showLose(onRetry, onLevelSelect, onMainMenu) {
        const overlay = this.createOverlay();
        const container = this.createContainer();

        const panelHeight = onMainMenu ? 320 : 275;
        this.createPanel(container, 350, panelHeight, 24);

        // Title
        const title = this.scene.add.text(0, -panelHeight / 2 + 45, 'Out of Moves!', {
            fontFamily: GameConfig.UI.FONT_FAMILY,
            fontSize: '34px',
            color: '#ff4757'
        }).setOrigin(0.5);
        container.add(title);

        // Status
        const status = this.scene.add.text(0, -panelHeight / 2 + 95, 'Objective not met.', {
            fontFamily: GameConfig.UI.FONT_FAMILY_BODY,
            fontSize: '22px',
            color: '#555555'
        }).setOrigin(0.5);
        container.add(status);

        // Buttons with generous spacing and balanced margins
        this.createButton(container, 0, -panelHeight / 2 + 165, 'Try Again', onRetry, 0.9);
        if (onMainMenu) {
            this.createButton(container, -85, -panelHeight / 2 + 235, 'Levels', onLevelSelect, 0.72);
            this.createButton(container, 85, -panelHeight / 2 + 235, 'Main Menu', onMainMenu, 0.72);
        } else {
            this.createButton(container, 0, -panelHeight / 2 + 235, 'Level Select', onLevelSelect, 0.9);
        }

        this.animateIn(container);
    }

    showWin(config) {
        const { score, stars, awardedPowerups, currentLevel, onNext, onReplay, onLevelSelect, onMainMenu, soundManager, maxLevel } = config;
        const totalLevels = maxLevel || 60;

        const overlay = this.createOverlay();
        const container = this.createContainer();

        const panelHeight = awardedPowerups.length > 0 ? 490 : 410;
        this.createPanel(container, 360, panelHeight, 25);

        // Title
        const title = this.scene.add.text(0, -panelHeight / 2 + 42, 'Level Complete!', {
            fontFamily: GameConfig.UI.FONT_FAMILY,
            fontSize: '35px',
            color: '#4ade80'
        }).setOrigin(0.5);
        container.add(title);

        // Stars
        for (let i = 0; i < 3; i++) {
            const star = this.scene.add.image(-60 + i * 60, -panelHeight / 2 + 105, i < stars ? 'star_filled' : 'star_empty');
            star.setScale(0);
            container.add(star);
            this.scene.tweens.add({
                targets: star,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 300,
                delay: 200 + i * 200,
                ease: 'Back.easeOut'
            });
        }

        // Score
        const scoreText = this.scene.add.text(0, -panelHeight / 2 + 160, `Score: ${score}`, {
            fontFamily: GameConfig.UI.FONT_FAMILY_BODY,
            fontSize: '28px',
            color: '#333333'
        }).setOrigin(0.5);
        container.add(scoreText);

        // Calculate button area start
        let buttonStartY;

        // Powerup rewards
        if (awardedPowerups.length > 0) {
            const rewardLabel = this.scene.add.text(0, -panelHeight / 2 + 200, 'Rewards:', {
                fontFamily: GameConfig.UI.FONT_FAMILY_BODY,
                fontSize: '18px',
                color: '#666666'
            }).setOrigin(0.5);
            container.add(rewardLabel);

            const spacing = 55;
            const startX = -((awardedPowerups.length - 1) * spacing) / 2;

            awardedPowerups.forEach((type, index) => {
                const powerupConfig = GameConfig.POWERUPS[type];
                const iconX = startX + index * spacing;

                const rewardIcon = this.scene.add.text(iconX, -panelHeight / 2 + 235, powerupConfig.icon, {
                    fontSize: '36px'
                }).setOrigin(0.5).setScale(0);
                container.add(rewardIcon);

                this.scene.tweens.add({
                    targets: rewardIcon,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 400,
                    delay: 800 + index * 200,
                    ease: 'Back.easeOut',
                    onStart: () => {
                        if (soundManager) soundManager.play('select');
                    }
                });

                const plusOne = this.scene.add.text(iconX + 22, -panelHeight / 2 + 215, '+1', {
                    fontFamily: GameConfig.UI.FONT_FAMILY,
                    fontSize: '14px',
                    color: '#4ade80',
                    stroke: '#ffffff',
                    strokeThickness: 2
                }).setOrigin(0.5).setAlpha(0);
                container.add(plusOne);

                this.scene.tweens.add({
                    targets: plusOne,
                    alpha: 1,
                    duration: 300,
                    delay: 1000 + index * 200,
                    ease: 'Power2'
                });
            });
            buttonStartY = -panelHeight / 2 + 295;
        } else {
            buttonStartY = -panelHeight / 2 + 215;
        }

        // Buttons with clean spacing
        const buttonSpacing = 68;

        if (currentLevel < totalLevels) {
            this.createButton(container, 0, buttonStartY, 'Next Level', onNext, 0.9);
        } else {
            this.createButton(container, 0, buttonStartY, 'Level Select', onNext, 0.9);
        }

        this.createButton(container, 0, buttonStartY + buttonSpacing, 'Replay', onReplay, 0.9);
        if (onMainMenu) {
            this.createButton(container, -85, buttonStartY + buttonSpacing * 2, 'Levels', onLevelSelect, 0.72);
            this.createButton(container, 85, buttonStartY + buttonSpacing * 2, 'Main Menu', onMainMenu, 0.72);
        } else {
            this.createButton(container, 0, buttonStartY + buttonSpacing * 2, 'Level Select', onLevelSelect, 0.9);
        }

        this.animateIn(container);
    }

    showPause(config) {
        const { onResume, onRestart, onLevelSelect, onMainMenu, onQuit, soundManager } = config;

        const overlay = this.createOverlay();
        const container = this.createContainer();

        const panelWidth = 340;
        const panelHeight = 470;
        this.createPanel(container, panelWidth, panelHeight, 24);

        // Title
        const title = this.scene.add.text(0, -185, 'PAUSED', {
            fontFamily: GameConfig.UI.FONT_FAMILY,
            fontSize: '34px',
            color: '#ff6b9d'
        }).setOrigin(0.5);
        container.add(title);

        // 4 Action Buttons with clean 10px vertical gap between them
        const btnScale = 0.88; // 176px wide, 53px high
        const btnSpacing = 63; // 63 - 53 = 10px clear vertical gap between buttons!
        const btnStartY = -118;

        this.createButton(container, 0, btnStartY, 'Resume', () => {
            this.close();
            onResume();
        }, btnScale);

        this.createButton(container, 0, btnStartY + btnSpacing, 'Restart', onRestart, btnScale);
        this.createButton(container, 0, btnStartY + btnSpacing * 2, 'Level Select', onLevelSelect || onQuit, btnScale);
        this.createButton(container, 0, btnStartY + btnSpacing * 3, 'Main Menu', onMainMenu || onQuit, btnScale);

        // Settings Plate for Music & Sound toggles
        const toggleBg = this.scene.add.graphics();
        toggleBg.fillStyle(0xf5f6fa, 0.95);
        toggleBg.fillRoundedRect(-120, 115, 240, 84, 14);
        toggleBg.lineStyle(1.5, 0xe2e8f0, 0.8);
        toggleBg.strokeRoundedRect(-120, 115, 240, 84, 14);
        container.add(toggleBg);

        // Music toggle - left-aligned checkbox row
        const musicOn = localStorage.getItem('sugarSplash_music') !== 'false';
        const musicText = this.scene.add.text(-80, 138, musicOn ? '☑ Music' : '☐ Music', {
            fontFamily: GameConfig.UI.FONT_FAMILY_BODY,
            fontSize: '22px',
            color: musicOn ? '#2ed573' : '#a4b0be'
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        container.add(musicText);

        musicText.on('pointerup', () => {
            const currentState = localStorage.getItem('sugarSplash_music') !== 'false';
            const newState = !currentState;
            localStorage.setItem('sugarSplash_music', newState.toString());
            musicText.setText(newState ? '☑ Music' : '☐ Music');
            musicText.setColor(newState ? '#2ed573' : '#a4b0be');
            if (newState) {
                soundManager?.startMusic();
            } else {
                soundManager?.stopMusic();
            }
        });

        // Sound toggle - left-aligned checkbox row (flush with Music checkbox!)
        const soundOn = localStorage.getItem('sugarSplash_sound') !== 'false';
        const soundText = this.scene.add.text(-80, 175, soundOn ? '☑ Sound' : '☐ Sound', {
            fontFamily: GameConfig.UI.FONT_FAMILY_BODY,
            fontSize: '22px',
            color: soundOn ? '#2ed573' : '#a4b0be'
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        container.add(soundText);

        soundText.on('pointerup', () => {
            const currentState = localStorage.getItem('sugarSplash_sound') !== 'false';
            const newState = !currentState;
            localStorage.setItem('sugarSplash_sound', newState.toString());
            soundText.setText(newState ? '☑ Sound' : '☐ Sound');
            soundText.setColor(newState ? '#2ed573' : '#a4b0be');
            this.scene.sound.mute = !newState;
        });

        this.animateIn(container);

        return { overlay, container };
    }

    showConfirmation(message, onYes, onNo) {
        const container = this.createContainer(600);

        this.createPanel(container, 320, 210, 22);

        // Icon
        const icon = this.scene.add.text(0, -62, '⚠️', { fontSize: '36px' }).setOrigin(0.5);
        container.add(icon);

        // Message
        const msg = this.scene.add.text(0, -12, message, {
            fontFamily: GameConfig.UI.FONT_FAMILY_BODY,
            fontSize: '18px',
            color: '#333333',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);
        container.add(msg);

        // Buttons (scale 0.58 = 116px width each, placed at -68 and +68 for a clean 20px gap!)
        this.createButton(container, -68, 58, 'Yes', () => {
            container.destroy();
            onYes();
        }, 0.58);

        this.createButton(container, 68, 58, 'No', () => {
            container.destroy();
            onNo();
        }, 0.58);

        this.animateIn(container, 200);
        return container;
    }

    // --- Utility ---

    close() {
        if (this.currentOverlay) {
            this.currentOverlay.destroy();
            this.currentOverlay = null;
        }
        if (this.currentContainer) {
            this.currentContainer.destroy();
            this.currentContainer = null;
        }
    }

    destroy() {
        this.close();
        this.scene = null;
    }
}
