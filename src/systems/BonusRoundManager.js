import { GameConfig } from '../Config.js';

/**
 * BonusRoundManager - Handles the end-of-level bonus round
 * Converts remaining moves to specials and activates them for bonus points
 */
export default class BonusRoundManager {
    constructor(scene, board, soundManager) {
        this.scene = scene;
        this.board = board;
        this.soundManager = soundManager;
    }

    async play(movesRemaining, onMovesUpdate) {
        if (movesRemaining <= 0) return 0;

        // --- PHASE 0: Setup & Turbo Speed ---
        const bonusScoreStart = this.scene.score;
        this.board.inputLocked = true;
        this.board.inBonusRound = true;
        this.skipRequested = false;

        // Speed up all board/cascade tweens during the bonus round (tap anywhere to ultra-fast-forward)
        const baseTimeScale = 2.8;
        if (this.scene?.tweens) {
            this.scene.tweens.timeScale = baseTimeScale;
        }
        const onSkipTap = () => {
            this.skipRequested = true;
            if (this.scene?.tweens) {
                this.scene.tweens.timeScale = 8.0;
            }
        };
        if (this.scene?.input) {
            this.scene.input.once('pointerdown', onSkipTap);
        }

        const fastDelay = (ms) => {
            if (this.skipRequested) return Promise.resolve();
            const scale = this.scene?.tweens?.timeScale || baseTimeScale;
            return new Promise(r => setTimeout(r, Math.max(8, Math.round(ms / scale))));
        };

        let bonusText = null;
        let bonusCounter = null;
        let currentMoves = movesRemaining;

        try {
            // Show BONUS text with fast entrance animation
            bonusText = this.scene.add.text(this.scene.cameras.main.width / 2, 180, 'BONUS!', {
                fontFamily: GameConfig.UI.FONT_FAMILY,
                fontSize: '52px',
                color: '#ffeb3b',
                stroke: '#ff6b00',
                strokeThickness: 8
            }).setOrigin(0.5).setDepth(100).setScale(0);

            this.scene.tweens.add({
                targets: bonusText,
                scaleX: 1,
                scaleY: 1,
                duration: 280,
                ease: 'Back.easeOut'
            });

            // Live bonus counter
            bonusCounter = this.scene.add.text(this.scene.cameras.main.width / 2, 230, 'Bonus: +0', {
                fontFamily: GameConfig.UI.FONT_FAMILY,
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#333333',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(100).setAlpha(0);

            this.scene.tweens.add({
                targets: bonusCounter,
                alpha: 1,
                duration: 150,
                delay: 80
            });

            await fastDelay(350);
            if (!this.scene || !this.board) return movesRemaining;

            // --- PHASE 1: Rapidly convert moves to specials ---
            const specialWeights = { line_h: 30, line_v: 30, bomb: 35, color_bomb: 5 };
            const movesToConvert = Math.min(movesRemaining, 10);

            for (let i = 0; i < movesToConvert; i++) {
                if (!this.scene || !this.board) return currentMoves;
                // Find random movable normal candy
                const candidates = [];
                for (let r = 0; r < this.board.rows; r++) {
                    for (let c = 0; c < this.board.cols; c++) {
                        const candy = this.board.candies[r][c];
                        if (candy && candy.active && !candy.isSpecial && !candy.isIngredient && this.board.canSwapAt(r, c)) {
                            candidates.push(candy);
                        }
                    }
                }

                if (candidates.length === 0) break;

                // Pick random candy and weighted random special type
                const candy = candidates[Math.floor(Math.random() * candidates.length)];
                const specialType = this.weightedRandomSpecial(specialWeights);
                candy.makeSpecial(specialType);
                if (specialType === 'color_bomb') {
                    candy.candyType = 99;
                    this.board.grid[candy.row][candy.col] = 99;
                }

                // Sparkle particle effect at conversion
                if (this.scene.emitter) {
                    const pos = this.board.gridToWorld(candy.row, candy.col);
                    this.scene.emitter.setConfig({
                        speed: { min: 50, max: 150 },
                        scale: { start: 0.4, end: 0 },
                        lifespan: 300,
                        tint: 0xffff00
                    });
                    this.scene.emitter.emitParticleAt(pos.x, pos.y, 8);
                }

                // Sound
                if (this.soundManager) this.soundManager.play('select');

                // Update moves counter
                currentMoves--;
                if (onMovesUpdate) onMovesUpdate(currentMoves);

                await fastDelay(90);
            }

            // Convert any remaining moves above 10 into direct bonus points (+250 each) in a quick burst
            if (currentMoves > 0) {
                const extraMoves = currentMoves;
                currentMoves = 0;
                if (onMovesUpdate) onMovesUpdate(0);
                this.scene.events.emit('scoreUpdate', extraMoves * 250, 1);
                if (bonusCounter?.scene) {
                    bonusCounter.setText(`Bonus: +${this.scene.score - bonusScoreStart}`);
                }
                await fastDelay(80);
            }

            if (!this.scene || !this.board) return currentMoves;
            if (bonusText?.scene) bonusText.destroy();

            // --- PHASE 2: Rapid-Fire Volley Activation (all specials per wave simultaneously!) ---
            const maxWaves = 2;
            for (let wave = 0; wave < maxWaves; wave++) {
                if (!this.scene || !this.board) return currentMoves;
                const allSpecials = this.getAllSpecialsOnBoard();
                if (allSpecials.length === 0) break;

                this.shuffleArray(allSpecials);
                const triggeredSet = new Set();

                // Launch all specials in this wave in a rapid staggered volley instead of waiting one by one
                const volleyPromises = allSpecials.map((special, idx) => (async () => {
                    await fastDelay(idx * 85);
                    if (!this.scene || !this.board || !special.active || triggeredSet.has(special)) return;
                    if (this.soundManager) {
                        this.soundManager.play(special.specialType === 'bomb' || special.specialType === 'color_bomb' ? 'bomb' : 'line');
                    }
                    await this.board.actionProcessor.activateSpecial(special, null, triggeredSet);
                })());

                await Promise.all(volleyPromises);
                if (!this.scene || !this.board) return currentMoves;

                // Single gravity + refill + cascade pass for the entire wave
                await this.board.applyGravity();
                if (!this.scene || !this.board) return currentMoves;
                await this.board.fillEmptySpaces();
                if (!this.scene || !this.board) return currentMoves;
                await this.board.processCascades();
                if (!this.scene || !this.board) return currentMoves;

                // Update live bonus counter
                const currentBonus = this.scene.score - bonusScoreStart;
                if (bonusCounter?.scene) {
                    bonusCounter.setText(`Bonus: +${currentBonus}`);
                    this.scene.tweens.add({
                        targets: bonusCounter,
                        scaleX: 1.15,
                        scaleY: 1.15,
                        duration: 80,
                        yoyo: true
                    });

                    if (this.scene.particleManager) {
                        const intensity = Math.min(currentBonus / 500, 2);
                        this.scene.particleManager.emitCoins(
                            this.scene.cameras.main.width / 2,
                            bonusCounter.y + 30,
                            0.5 + intensity * 0.5
                        );
                    }
                }
            }

            if (!this.scene || !this.board) return currentMoves;

            // --- PHASE 3: Snappy Grand Finale ---
            const totalBonus = this.scene.score - bonusScoreStart;

            if (bonusCounter?.scene) {
                bonusCounter.setText(`Bonus: +${totalBonus}`);
                this.scene.tweens.add({
                    targets: bonusCounter,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    duration: 250,
                    ease: 'Back.easeOut'
                });

                if (this.scene.particleManager && totalBonus > 0) {
                    const width = this.scene.cameras.main.width;
                    this.scene.particleManager.emitCoins(width / 2, bonusCounter.y, 2);
                    this.scene.particleManager.emitCoinRain(width, -20, Math.min(50, Math.floor(totalBonus / 100)));
                }
            }

            await this.showConfetti();
            await fastDelay(350);

            return currentMoves;
        } finally {
            if (this.scene?.input) {
                this.scene.input.off('pointerdown', onSkipTap);
            }
            if (this.scene?.tweens) {
                this.scene.tweens.timeScale = 1.0;
            }
            if (this.board) {
                this.board.inBonusRound = false;
            }
            if (bonusText?.scene) bonusText.destroy();
            if (bonusCounter?.scene) bonusCounter.destroy();
        }
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
                if (candy && candy.active && candy.isSpecial && this.board.crate[r][c] === 0) {
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
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const colors = [0xff4757, 0x3742fa, 0x2ed573, 0xffa502, 0xa55eea, 0xff7f50, 0xffeb3b];

        // Create multiple confetti bursts (faster, fewer pieces)
        for (let burst = 0; burst < 2; burst++) {
            for (let i = 0; i < 15; i++) {
                const x = Math.random() * width;
                const color = colors[Math.floor(Math.random() * colors.length)];

                const confetti = this.scene.add.graphics({ x, y: -20 });
                confetti.fillStyle(color, 1);
                confetti.fillRect(-4, -4, 8, 8);
                confetti.setDepth(150);

                this.scene.tweens.add({
                    targets: confetti,
                    y: height + 50,
                    x: x + (Math.random() - 0.5) * 200,
                    rotation: Math.random() * 10,
                    duration: 1000 + Math.random() * 500,
                    ease: 'Quad.easeIn',
                    delay: burst * 100 + Math.random() * 50,
                    onComplete: () => confetti.destroy()
                });
            }

            if (this.soundManager && burst === 0) this.soundManager.play('win');
        }

        // Camera shake for impact
        this.scene.cameras.main.shake(150, 0.01);

        if (!this.skipRequested) {
            const scale = this.scene?.tweens?.timeScale || 2.8;
            await new Promise(r => setTimeout(r, Math.max(50, Math.round(400 / scale))));
        }
    }

    destroy() {
        this.scene = null;
        this.board = null;
        this.soundManager = null;
    }
}
