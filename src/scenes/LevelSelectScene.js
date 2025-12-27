import { GameConfig } from '../Config.js';

export default class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super('LevelSelectScene');
        this.totalLevels = 20;
        this.columns = 4;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.createBackground(width, height);

        // Header
        this.createHeader(width, height);

        // Level grid
        this.createLevelGrid(width, height);

        // Back button
        this.createBackButton(width, height);

        // Sound controls
        this.createSoundControls(width, height);

        // Powerups display at bottom
        this.createPowerupsDisplay(width, height);
    }

    createBackground(width, height) {
        const graphics = this.add.graphics();
        const steps = 20;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
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

    createHeader(width, height) {
        // Title
        this.add.text(width / 2, 60, 'Select Level', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '42px',
            color: '#ff6b9d',
            stroke: '#ffffff',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Total stars display
        const saveData = this.getSaveData();
        const totalStars = this.calculateTotalStars(saveData);
        const maxStars = this.totalLevels * 3;

        this.add.image(width / 2 - 40, 110, 'star_filled').setScale(0.8);
        this.add.text(width / 2, 110, `${totalStars} / ${maxStars}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0, 0.5);
    }

    createLevelGrid(width, height) {
        const saveData = this.getSaveData();

        const startY = 180;
        const buttonSize = 100;
        const padding = 20;
        const gridWidth = this.columns * buttonSize + (this.columns - 1) * padding;
        const startX = (width - gridWidth) / 2 + buttonSize / 2;

        // Create scrollable container for levels
        const rows = Math.ceil(this.totalLevels / this.columns);
        const gridHeight = rows * (buttonSize + padding);

        // Create container for level buttons
        const container = this.add.container(0, 0);

        for (let i = 0; i < this.totalLevels; i++) {
            const level = i + 1;
            const col = i % this.columns;
            const row = Math.floor(i / this.columns);

            const x = startX + col * (buttonSize + padding);
            const y = startY + row * (buttonSize + padding);

            const levelData = saveData.levels[level] || { completed: false, stars: 0 };
            // First 5 levels always unlocked, rest unlock when previous is completed
            const isUnlocked = level <= 5 || saveData.levels[level - 1]?.completed;

            this.createLevelButton(container, x, y, level, levelData, isUnlocked, buttonSize);
        }

        // Enable scrolling if content exceeds screen
        const visibleHeight = height - startY - 100;
        if (gridHeight > visibleHeight) {
            const minY = -(gridHeight - visibleHeight);
            const maxY = 0;

            // Track drag state
            let isDragging = false;
            let dragStartY = 0;
            let containerStartY = 0;

            this.input.on('pointerdown', (pointer) => {
                isDragging = true;
                dragStartY = pointer.y;
                containerStartY = container.y;
            });

            this.input.on('pointermove', (pointer) => {
                if (isDragging && pointer.isDown) {
                    const deltaY = pointer.y - dragStartY;
                    container.y = Phaser.Math.Clamp(containerStartY + deltaY, minY, maxY);
                }
            });

            this.input.on('pointerup', () => {
                isDragging = false;
            });

            // Mouse wheel support
            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
                container.y = Phaser.Math.Clamp(container.y - deltaY * 0.5, minY, maxY);
            });
        }
    }

    createLevelButton(container, x, y, level, levelData, isUnlocked, size) {
        // Button background
        const graphics = this.add.graphics();

        if (isUnlocked) {
            // Unlocked level - colorful button
            graphics.fillStyle(0xffffff, 0.9);
            graphics.fillRoundedRect(x - size/2, y - size/2, size, size, 15);
            graphics.fillStyle(0xff6b9d, 1);
            graphics.fillRoundedRect(x - size/2 + 4, y - size/2 + 4, size - 8, size - 8, 12);
        } else {
            // Locked level - gray button
            graphics.fillStyle(0x666666, 0.7);
            graphics.fillRoundedRect(x - size/2, y - size/2, size, size, 15);
        }

        container.add(graphics);

        if (isUnlocked) {
            // Level number
            const levelText = this.add.text(x, y - 10, level.toString(), {
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: '32px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            container.add(levelText);

            // Stars
            for (let s = 0; s < 3; s++) {
                const starX = x - 25 + s * 25;
                const starY = y + 25;
                const starTexture = s < levelData.stars ? 'star_filled' : 'star_empty';
                const star = this.add.image(starX, starY, starTexture).setScale(0.5);
                container.add(star);
            }

            // Make interactive
            const hitArea = this.add.rectangle(x, y, size, size, 0x000000, 0)
                .setInteractive({ useHandCursor: true });
            container.add(hitArea);

            hitArea.on('pointerover', () => {
                graphics.clear();
                graphics.fillStyle(0xffffff, 1);
                graphics.fillRoundedRect(x - size/2, y - size/2, size, size, 15);
                graphics.fillStyle(0xff8fad, 1);
                graphics.fillRoundedRect(x - size/2 + 4, y - size/2 + 4, size - 8, size - 8, 12);
            });

            hitArea.on('pointerout', () => {
                graphics.clear();
                graphics.fillStyle(0xffffff, 0.9);
                graphics.fillRoundedRect(x - size/2, y - size/2, size, size, 15);
                graphics.fillStyle(0xff6b9d, 1);
                graphics.fillRoundedRect(x - size/2 + 4, y - size/2 + 4, size - 8, size - 8, 12);
            });

            hitArea.on('pointerup', () => {
                this.scene.start('GameScene', { level: level });
            });
        } else {
            // Lock icon
            const lockText = this.add.text(x, y, '🔒', {
                fontSize: '36px'
            }).setOrigin(0.5);
            container.add(lockText);
        }
    }

    createBackButton(width, height) {
        const backBtn = this.add.text(60, 60, '←', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#ff6b9d',
            strokeThickness: 4
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setScale(1.2));
        backBtn.on('pointerout', () => backBtn.setScale(1));
        backBtn.on('pointerup', () => this.scene.start('MenuScene'));
    }

    createSoundControls(width, height) {
        // Settings button (gear icon) - opens settings dialog
        const settingsBtnBg = this.add.graphics();
        settingsBtnBg.fillStyle(0x000000, 0.3);
        settingsBtnBg.fillRoundedRect(width - 70, 25, 50, 50, 12);

        const settingsBtn = this.add.text(width - 45, 50, '⚙️', {
            fontSize: '28px'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        settingsBtn.on('pointerover', () => {
            settingsBtn.setScale(1.1);
            settingsBtnBg.clear();
            settingsBtnBg.fillStyle(0x000000, 0.5);
            settingsBtnBg.fillRoundedRect(width - 70, 25, 50, 50, 12);
        });
        settingsBtn.on('pointerout', () => {
            settingsBtn.setScale(1);
            settingsBtnBg.clear();
            settingsBtnBg.fillStyle(0x000000, 0.3);
            settingsBtnBg.fillRoundedRect(width - 70, 25, 50, 50, 12);
        });
        settingsBtn.on('pointerup', () => {
            this.showSettingsDialog(width, height);
        });

        // Apply current mute state
        const soundOn = localStorage.getItem('sugarSplash_sound') !== 'false';
        this.sound.mute = !soundOn;
    }

    showSettingsDialog(width, height) {
        // Overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(500);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

        // Container
        const container = this.add.container(width / 2, height / 2);
        container.setDepth(501);

        // Panel
        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 0.95);
        panel.fillRoundedRect(-150, -140, 300, 280, 20);
        container.add(panel);

        // Title
        const title = this.add.text(0, -100, 'Settings', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '32px',
            color: '#ff6b9d'
        }).setOrigin(0.5);
        container.add(title);

        // Music toggle
        const musicOn = localStorage.getItem('sugarSplash_music') !== 'false';
        const musicText = this.add.text(0, -30, musicOn ? '☑ Music' : '☐ Music', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '28px',
            color: musicOn ? '#4ade80' : '#666666'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        container.add(musicText);

        musicText.on('pointerup', () => {
            const currentState = localStorage.getItem('sugarSplash_music') !== 'false';
            const newState = !currentState;
            localStorage.setItem('sugarSplash_music', newState.toString());
            musicText.setText(newState ? '☑ Music' : '☐ Music');
            musicText.setColor(newState ? '#4ade80' : '#666666');
        });

        // Sound toggle
        const soundOn = localStorage.getItem('sugarSplash_sound') !== 'false';
        const soundText = this.add.text(0, 30, soundOn ? '☑ Sound' : '☐ Sound', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '28px',
            color: soundOn ? '#4ade80' : '#666666'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        container.add(soundText);

        soundText.on('pointerup', () => {
            const currentState = localStorage.getItem('sugarSplash_sound') !== 'false';
            const newState = !currentState;
            localStorage.setItem('sugarSplash_sound', newState.toString());
            soundText.setText(newState ? '☑ Sound' : '☐ Sound');
            soundText.setColor(newState ? '#4ade80' : '#666666');
            this.sound.mute = !newState;
        });

        // Close button
        const closeBtn = this.add.image(0, 100, 'button').setScale(0.9).setInteractive({ useHandCursor: true });
        const closeBtnText = this.add.text(0, 100, 'Close', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '22px',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(closeBtn);
        container.add(closeBtnText);

        closeBtn.on('pointerover', () => closeBtn.setScale(1));
        closeBtn.on('pointerout', () => closeBtn.setScale(0.9));
        closeBtn.on('pointerup', () => {
            overlay.destroy();
            container.destroy();
        });

        // Animate in
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

    getSaveData() {
        const defaultData = {
            currentLevel: 1,
            levels: {},
            settings: { musicOn: true, sfxOn: true }
        };

        try {
            const saved = localStorage.getItem('sugarSplash_save');
            return saved ? JSON.parse(saved) : defaultData;
        } catch (e) {
            return defaultData;
        }
    }

    calculateTotalStars(saveData) {
        let total = 0;
        for (const level in saveData.levels) {
            total += saveData.levels[level].stars || 0;
        }
        return total;
    }

    getPowerups() {
        try {
            const saved = localStorage.getItem('sugarSplash_powerups');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    }

    createPowerupsDisplay(width, height) {
        const powerups = this.getPowerups();
        const powerupTypes = ['hammer', 'bomb', 'rowcol', 'colorblast'];

        // Bottom bar background
        const bottomBar = this.add.graphics();
        bottomBar.fillStyle(0x000000, 0.4);
        bottomBar.fillRoundedRect(20, height - 85, width - 40, 70, 15);

        // Label
        this.add.text(40, height - 70, 'Powerups:', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });

        // Powerup icons with counts
        const startX = 150;
        const spacing = 80;

        powerupTypes.forEach((type, index) => {
            const config = GameConfig.POWERUPS[type];
            const count = powerups[type] || 0;
            const x = startX + index * spacing;

            // Icon
            this.add.text(x, height - 55, config.icon, {
                fontSize: '28px'
            }).setOrigin(0.5);

            // Count
            this.add.text(x + 18, height - 65, `×${count}`, {
                fontFamily: 'Arial Black',
                fontSize: '14px',
                color: count > 0 ? '#4ade80' : '#999999',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0, 0.5);
        });
    }
}
