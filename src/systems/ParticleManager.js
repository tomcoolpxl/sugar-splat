import { GameConfig } from '../Config.js';

/**
 * ParticleManager - Handles all particle effects in the game
 */
export default class ParticleManager {
    constructor(scene, board) {
        this.scene = scene;
        this.board = board;
        this.emitter = null;
    }

    create() {
        this.emitter = this.scene.add.particles(0, 0, 'star_filled', {
            speed: { min: 50, max: 200 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            blendMode: 'ADD',
            emitting: false
        });
        this.emitter.setDepth(100);
    }

    // Emit particles when a candy is cleared
    emitCandy(row, col, type) {
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

    // Emit particles when jelly is cleared
    emitJelly(row, col) {
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

    // Emit particles when a special candy is activated
    emitSpecial(row, col, type) {
        if (!this.board || !this.emitter) return;
        const pos = this.board.gridToWorld(row, col);

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

    // General purpose emit at position with color
    emitAt(x, y, count, tint = 0xffffff) {
        if (!this.emitter) return;

        this.emitter.setConfig({
            tint: tint,
            speed: { min: 100, max: 200 },
            scale: { start: 0.5, end: 0 },
            lifespan: 400,
            angle: { min: 0, max: 360 }
        });

        this.emitter.emitParticleAt(x, y, count);
    }

    // Get the raw emitter for external use (e.g., BonusRoundManager)
    getEmitter() {
        return this.emitter;
    }

    destroy() {
        this.emitter = null;
        this.scene = null;
        this.board = null;
    }
}
