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
        const soundOn = localStorage.getItem('sugarSplash_sound') !== 'false';

        // Sound toggle button (top right)
        const soundBtn = this.add.text(width - 40, 40, soundOn ? '🔊' : '🔇', {
            fontSize: '32px'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Label below
        const soundLabel = this.add.text(width - 40, 70, 'Sound', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        soundBtn.on('pointerover', () => soundBtn.setScale(1.2));
        soundBtn.on('pointerout', () => soundBtn.setScale(1));
        soundBtn.on('pointerup', () => {
            const currentState = localStorage.getItem('sugarSplash_sound') !== 'false';
            const newState = !currentState;
            localStorage.setItem('sugarSplash_sound', newState.toString());
            soundBtn.setText(newState ? '🔊' : '🔇');
            this.sound.mute = !newState;
        });

        // Apply current mute state
        this.sound.mute = !soundOn;
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
}
