export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Initialize Sound Manager
        this.soundManager = new SoundManager(this);
        this.soundManager.startMusic();

        // Background gradient
        this.createBackground(width, height);

        // Game title
        this.createTitle(width, height);

        // Play button
        this.createPlayButton(width, height);

        // Sound toggle
        this.createSoundToggle(width, height);

        // Floating candies decoration
        this.createFloatingCandies(width, height);
    }

    createBackground(width, height) {
        // Create gradient background
        const graphics = this.add.graphics();

        // Draw gradient manually with rectangles
        const steps = 20;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 255, g: 182, b: 193 },  // Light pink
                { r: 173, g: 216, b: 230 },  // Light blue
                steps,
                i
            );
            graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
            graphics.fillRect(0, (height / steps) * i, width, height / steps + 1);
        }
    }

    createTitle(width, height) {
        // Shadow
        this.add.text(width / 2 + 4, height * 0.2 + 4, 'Sugar Splash', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '64px',
            color: '#000000',
            align: 'center'
        }).setOrigin(0.5).setAlpha(0.3);

        // Main title
        const title = this.add.text(width / 2, height * 0.2, 'Sugar Splash', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '64px',
            color: '#ff6b9d',
            align: 'center',
            stroke: '#ffffff',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Title animation
        this.tweens.add({
            targets: title,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    createPlayButton(width, height) {
        // Button container
        const buttonY = height * 0.55;

        // Button background
        const button = this.add.image(width / 2, buttonY, 'button')
            .setInteractive({ useHandCursor: true })
            .setScale(1.5);

        // Button text
        const buttonText = this.add.text(width / 2, buttonY, 'PLAY', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '36px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Button hover effects
        button.on('pointerover', () => {
            this.tweens.add({
                targets: [button, buttonText],
                scaleX: 1.6,
                scaleY: 1.6,
                duration: 100,
                ease: 'Power2'
            });
        });

        button.on('pointerout', () => {
            this.tweens.add({
                targets: [button, buttonText],
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 100,
                ease: 'Power2'
            });
        });

        button.on('pointerdown', () => {
            this.tweens.add({
                targets: [button, buttonText],
                scaleX: 1.4,
                scaleY: 1.4,
                duration: 50,
                ease: 'Power2'
            });
        });

        button.on('pointerup', () => {
            this.tweens.add({
                targets: [button, buttonText],
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 50,
                ease: 'Power2',
                onComplete: () => {
                    this.scene.start('LevelSelectScene');
                }
            });
        });
    }

    createSoundToggle(width, height) {
        // Initialize sound state from localStorage or default to true
        const soundOn = localStorage.getItem('sugarSplash_sound') !== 'false';

        const toggleY = height * 0.9;

        // Sound icon (simple speaker shape using text for now)
        const soundIcon = this.add.text(width / 2, toggleY, soundOn ? '🔊' : '🔇', {
            fontSize: '48px'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        soundIcon.on('pointerup', () => {
            const currentState = localStorage.getItem('sugarSplash_sound') !== 'false';
            const newState = !currentState;
            localStorage.setItem('sugarSplash_sound', newState.toString());
            soundIcon.setText(newState ? '🔊' : '🔇');

            // Toggle game sound
            this.sound.mute = !newState;
            
            // Re-check music state
            if (newState) {
                // If turning on, we might need to restart/resume music logic if it was suppressed
                // But startMusic() handles mute check internally on each note
            }
        });

        // Apply saved sound state
        this.sound.mute = !soundOn;
    }

    createFloatingCandies(width, height) {
        // Add decorative floating candies
        const candyPositions = [
            { x: width * 0.15, y: height * 0.35, type: 0 },
            { x: width * 0.85, y: height * 0.35, type: 1 },
            { x: width * 0.1, y: height * 0.7, type: 2 },
            { x: width * 0.9, y: height * 0.7, type: 3 },
            { x: width * 0.2, y: height * 0.85, type: 4 },
            { x: width * 0.8, y: height * 0.45, type: 5 }
        ];

        candyPositions.forEach((pos, index) => {
            const candy = this.add.image(pos.x, pos.y, `candy_${pos.type}`)
                .setScale(0.8)
                .setAlpha(0.7);

            // Floating animation
            this.tweens.add({
                targets: candy,
                y: pos.y + 20,
                duration: 2000 + index * 200,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });

            // Slow rotation
            this.tweens.add({
                targets: candy,
                angle: 15,
                duration: 3000 + index * 300,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        });
    }
}
