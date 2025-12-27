/**
 * HintManager - Handles the hint system that shows valid moves after inactivity
 */
export default class HintManager {
    constructor(scene, board) {
        this.scene = scene;
        this.board = board;

        this.hintTimer = null;
        this.hintHand = null;
        this.hintGlow = null;
        this.hintDelay = 5000; // 5 seconds of inactivity before showing hint
    }

    start() {
        this.hintTimer = this.scene.time.addEvent({
            delay: this.hintDelay,
            callback: this.showHint,
            callbackScope: this,
            loop: true
        });

        // Reset hint on any pointer interaction
        this.scene.input.on('pointerdown', () => this.reset());
    }

    reset() {
        if (this.hintTimer) {
            this.hintTimer.reset({
                delay: this.hintDelay,
                callback: this.showHint,
                callbackScope: this,
                loop: true
            });
        }
        this.clear();
    }

    clear() {
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
        // Don't show hints during game over or when input is locked
        if (this.scene.isGameOver || this.board.inputLocked) return;

        const move = this.board.findValidMove();
        if (move && move.length > 0) {
            const targetCell = move[0];
            const candy = this.board.candies[targetCell.row][targetCell.col];
            if (!candy) return;

            this.clear();

            // Glowing highlight on the candy
            this.hintGlow = this.scene.add.image(candy.x, candy.y, 'glow');
            this.hintGlow.setDepth(10);
            this.hintGlow.setAlpha(0.5);
            this.scene.tweens.add({
                targets: this.hintGlow,
                alpha: 1,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 800,
                yoyo: true,
                repeat: -1
            });

            // Arrow indicating swap direction
            const destCell = move[1];
            const destCandy = this.board.candies[destCell.row][destCell.col];
            if (destCandy) {
                this.hintHand = this.scene.add.image(candy.x, candy.y, 'arrow');
                this.hintHand.setDepth(11);
                this.hintHand.setOrigin(0, 0.5);

                // Rotate arrow to point towards destination
                const angle = Phaser.Math.Angle.Between(candy.x, candy.y, destCandy.x, destCandy.y);
                this.hintHand.setRotation(angle);

                this.scene.tweens.add({
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

    destroy() {
        if (this.hintTimer) {
            this.hintTimer.remove();
            this.hintTimer = null;
        }
        this.clear();
        this.scene = null;
        this.board = null;
    }
}
