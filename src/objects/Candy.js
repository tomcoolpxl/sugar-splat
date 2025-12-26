export default class Candy extends Phaser.GameObjects.Image {
    constructor(scene, x, y, type, row, col) {
        super(scene, x, y, `candy_${type}`);

        this.scene = scene;
        this.candyType = type;
        this.row = row;
        this.col = col;

        // Special tile properties
        this.isSpecial = false;
        this.specialType = null; // 'line_h', 'line_v', 'bomb'

        // State
        this.isSelected = false;
        this.isLocked = false;

        // Add to scene
        scene.add.existing(this);

        // Enable input
        this.setInteractive({ useHandCursor: true });

        // Selection indicator
        this.selectionIndicator = null;
    }

    select() {
        if (this.isSelected) return;

        this.isSelected = true;

        // Create pulsing selection effect
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 100,
            ease: 'Back.easeOut'
        });

        // Add glow effect
        if (!this.selectionIndicator) {
            this.selectionIndicator = this.scene.add.graphics();
            this.selectionIndicator.setDepth(1.5); // Above jelly (0.5) but below locks (2)
        }

        this.updateSelectionGlow();

        // Pulse animation for glow
        this.glowTween = this.scene.tweens.add({
            targets: { alpha: 0.8 },
            alpha: 0.4,
            duration: 500,
            yoyo: true,
            repeat: -1,
            onUpdate: (tween) => {
                this.updateSelectionGlow(tween.getValue());
            }
        });
    }

    updateSelectionGlow(alpha = 0.8) {
        if (!this.selectionIndicator) return;

        this.selectionIndicator.clear();
        this.selectionIndicator.lineStyle(4, 0xffffff, alpha);
        this.selectionIndicator.strokeCircle(this.x, this.y, this.displayWidth / 2 + 4);
    }

    deselect() {
        if (!this.isSelected) return;

        this.isSelected = false;

        // Reset scale
        this.scene.tweens.add({
            targets: this,
            scaleX: 1,
            scaleY: 1,
            duration: 100,
            ease: 'Power2'
        });

        // Remove glow
        if (this.glowTween) {
            this.glowTween.stop();
            this.glowTween = null;
        }

        if (this.selectionIndicator) {
            this.selectionIndicator.clear();
        }
    }

    makeSpecial(specialType) {
        this.isSpecial = true;
        this.specialType = specialType;

        // Update texture based on special type
        switch (specialType) {
            case 'line_h':
                this.setTexture(`candy_${this.candyType}_line_h`);
                break;
            case 'line_v':
                this.setTexture(`candy_${this.candyType}_line_v`);
                break;
            case 'bomb':
                this.setTexture(`candy_${this.candyType}_bomb`);
                break;
        }

        // Creation animation
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 150,
            yoyo: true,
            ease: 'Back.easeOut'
        });
    }

    lock() {
        this.isLocked = true;
        this.disableInteractive();

        // Add lock overlay
        this.lockOverlay = this.scene.add.image(this.x, this.y, 'lock');
        this.lockOverlay.setDisplaySize(this.displayWidth, this.displayHeight);
        this.lockOverlay.setDepth(this.depth + 0.1);
    }

    unlock() {
        this.isLocked = false;
        this.setInteractive({ useHandCursor: true });

        if (this.lockOverlay) {
            // Unlock animation
            this.scene.tweens.add({
                targets: this.lockOverlay,
                alpha: 0,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 300,
                onComplete: () => {
                    this.lockOverlay.destroy();
                    this.lockOverlay = null;
                }
            });
        }
    }

    pop() {
        // Called when candy is cleared
        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: this,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                duration: 200,
                ease: 'Back.easeIn',
                onComplete: () => {
                    resolve();
                }
            });
        });
    }

    moveTo(row, col, targetX, targetY, duration = 150) {
        this.row = row;
        this.col = col;

        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: this,
                x: targetX,
                y: targetY,
                duration: duration,
                ease: 'Power2',
                onComplete: resolve
            });
        });
    }

    fall(targetY, duration = 200) {
        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: this,
                y: targetY,
                duration: duration,
                ease: 'Bounce.easeOut',
                onComplete: resolve
            });
        });
    }

    bounce() {
        // Quick bounce effect for feedback
        this.scene.tweens.add({
            targets: this,
            scaleX: 0.9,
            scaleY: 0.9,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }

    shake() {
        // Shake effect for invalid swap
        const startX = this.x;
        this.scene.tweens.add({
            targets: this,
            x: startX + 5,
            duration: 50,
            yoyo: true,
            repeat: 3,
            ease: 'Power2',
            onComplete: () => {
                this.x = startX;
            }
        });
    }

    destroy() {
        if (this.selectionIndicator) {
            this.selectionIndicator.destroy();
        }
        if (this.glowTween) {
            this.glowTween.stop();
        }
        if (this.lockOverlay) {
            this.lockOverlay.destroy();
        }
        super.destroy();
    }
}
