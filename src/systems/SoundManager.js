export default class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.context = scene.sound.context; // Web Audio Context
        this.sounds = {};
        
        // Define sound types and their fallback synth parameters
        this.soundDefs = {
            'swap': { type: 'sine', freqStart: 300, freqEnd: 500, duration: 0.1 },
            'match': { type: 'triangle', freqStart: 400, freqEnd: 800, duration: 0.15 },
            'invalid': { type: 'sawtooth', freqStart: 150, freqEnd: 100, duration: 0.2 },
            'cascade': { type: 'sine', freqStart: 600, freqEnd: 1200, duration: 0.2 },
            'win': { type: 'sine', freqStart: 400, freqEnd: 1000, duration: 0.5, arpeggio: true },
            'click': { type: 'square', freqStart: 800, freqEnd: 800, duration: 0.05 },
            'bomb': { type: 'noise', duration: 0.4 }, // Special handling
            'line': { type: 'sawtooth', freqStart: 800, freqEnd: 200, duration: 0.3 }
        };
    }

    preload() {
        // Try to load actual files if they exist (BootScene calls this)
        // this.scene.load.audio('swap', 'assets/audio/swap.mp3');
        // ...
    }

    play(key) {
        if (this.scene.sound.mute) return;

        // Try to play loaded sound first
        if (this.scene.cache.audio.exists(key)) {
            this.scene.sound.play(key);
            return;
        }

        // Fallback to synth
        this.playSynth(key);
    }

    playSynth(key) {
        if (!this.context) return; // No WebAudio (e.g. strict browser)

        const def = this.soundDefs[key];
        if (!def) return;

        if (def.type === 'noise') {
            this.playNoise(def.duration);
            return;
        }

        if (def.arpeggio) {
            this.playArpeggio(def);
            return;
        }

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = def.type;
        osc.frequency.setValueAtTime(def.freqStart, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(def.freqEnd, this.context.currentTime + def.duration);

        gain.gain.setValueAtTime(0.1, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + def.duration);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start();
        osc.stop(this.context.currentTime + def.duration);
    }

    playNoise(duration) {
        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.context.createBufferSource();
        noise.buffer = buffer;
        const gain = this.context.createGain();
        
        // Envelope
        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        noise.connect(gain);
        gain.connect(this.context.destination);
        noise.start();
    }

    playArpeggio(def) {
        // Simple major triad arpeggio
        const notes = [def.freqStart, def.freqStart * 1.25, def.freqStart * 1.5];
        const noteDur = def.duration / 3;

        notes.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            const time = this.context.currentTime + i * noteDur;

            osc.type = def.type;
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + noteDur);

            osc.connect(gain);
            gain.connect(this.context.destination);

            osc.start(time);
            osc.stop(time + noteDur);
        });
    }
}
