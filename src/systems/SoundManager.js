import { GameConfig } from '../Config.js';

export default class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.context = scene.sound.context; // Web Audio Context
        this.masterVolume = GameConfig.AUDIO.MASTER_VOLUME;

        // Music state
        this.musicGain = null;
        this.musicOsc = null;
        this.isMusicPlaying = false;
        this.currentNoteIndex = 0;
        this.musicTimer = null;

        // Sound definitions from config
        this.soundDefs = GameConfig.AUDIO.SOUNDS;

        // Music config from centralized settings
        this.musicConfig = GameConfig.AUDIO.MUSIC;
        this.drumConfig = GameConfig.AUDIO.DRUMS;
    }

    play(key) {
        if (this.scene.sound.mute) return;
        if (!this.ensureContextRunning()) return;

        this.playSynth(key);
    }

    // Ensure AudioContext is running (handles browser autoplay policies)
    ensureContextRunning() {
        if (!this.context) return false;

        if (this.context.state === 'suspended') {
            this.context.resume().catch(err => {
                console.warn('SoundManager: Failed to resume AudioContext:', err);
            });
            // Return false on first attempt when suspended - sound will play on next interaction
            return false;
        }

        return this.context.state === 'running';
    }

    playSynth(key) {
        if (!this.context || this.context.state !== 'running') return;

        const def = this.soundDefs[key];
        if (!def) {
            console.warn(`Sound definition not found: ${key}`);
            return;
        }

        if (def.type === 'noise') {
            this.playNoise(def);
            return;
        }

        if (def.type === 'sequence') {
            this.playSequence(def);
            return;
        }

        // Single Tone
        this.playTone(def);
    }

    playTone(def) {
        if (!this.context || this.context.state !== 'running') return;

        const t = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = def.type || 'sine';
        
        // Frequency Envelope
        osc.frequency.setValueAtTime(def.freqStart, t);
        if (def.freqEnd) {
            if (def.slide) {
                osc.frequency.linearRampToValueAtTime(def.freqEnd, t + def.duration);
            } else {
                osc.frequency.exponentialRampToValueAtTime(def.freqEnd, t + def.duration);
            }
        }

        // Volume Envelope
        const volume = (def.vol || 0.2) * this.masterVolume;
        const attack = def.attack || 0.01;
        const decay = def.decay || (def.duration - attack);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(volume, t + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start(t);
        osc.stop(t + def.duration + 0.1);
    }

    playSequence(def) {
        if (!this.context || this.context.state !== 'running') return;

        const t = this.context.currentTime;
        const instrument = def.instrument || 'sine';
        const volume = (def.vol || 0.2) * this.masterVolume;

        def.notes.forEach(note => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = instrument;
            osc.frequency.setValueAtTime(note.freq, t + note.time);

            const startTime = t + note.time;
            const endTime = startTime + note.dur;
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
            gain.gain.linearRampToValueAtTime(0, endTime);

            osc.connect(gain);
            gain.connect(this.context.destination);

            osc.start(startTime);
            osc.stop(endTime);
        });
    }

    playNoise(def) {
        if (!this.context || this.context.state !== 'running') return;

        const duration = def.duration;
        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.context.createBufferSource();
        noise.buffer = buffer;
        const gain = this.context.createGain();
        
        const volume = (def.vol || 0.3) * this.masterVolume;
        gain.gain.setValueAtTime(volume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);

        noise.connect(gain);
        gain.connect(this.context.destination);
        noise.start();
    }

    startMusic() {
        if (this.isMusicPlaying) return;
        if (!this.ensureContextRunning()) {
            // Retry after a short delay when context resumes
            setTimeout(() => this.startMusic(), 100);
            return;
        }

        this.isMusicPlaying = true;
        this.nextNoteTime = this.context.currentTime + 0.1;
        this.stepIndex = 0;
        this.tempo = this.musicConfig.TEMPO;
        this.secondsPerStep = 60 / this.tempo / 4; // 16th notes

        // Song Structure from config
        this.chordProgression = this.musicConfig.CHORD_PROGRESSION;

        this.scheduleNextStep();
    }

    scheduleNextStep() {
        if (!this.isMusicPlaying) return;
        if (!this.context || this.context.state !== 'running') {
            // Context suspended mid-playback, stop music
            this.stopMusic();
            return;
        }

        // Schedule ahead
        while (this.nextNoteTime < this.context.currentTime + 0.1) {
            this.playStep(this.nextNoteTime);
            this.nextNoteTime += this.secondsPerStep;
            this.stepIndex++;
        }

        this.musicTimer = setTimeout(() => this.scheduleNextStep(), 25);
    }

    playStep(time) {
        if (this.scene.sound.mute) return;
        if (!this.context || this.context.state !== 'running') return;

        const measure = Math.floor(this.stepIndex / 16);
        const step = this.stepIndex % 16;
        const currentChord = this.chordProgression[measure % this.chordProgression.length];
        const root = currentChord.root;

        // --- Bass (16th notes, pumping) ---
        if (step % 2 === 0) {
            this.playSynthNote(root, 0.1, 'sawtooth', 0.1, time);
        } else {
            this.playSynthNote(root, 0.1, 'square', 0.05, time);
        }

        // --- Melody (Pentatonic riff) ---
        const scale = this.musicConfig.PENTATONIC_SCALE;

        if (step === 0 || step === 6 || step === 12) {
            const noteIdx = (measure + step) % scale.length;
            const freq = root * 2 * scale[noteIdx];
            this.playSynthNote(freq, 0.1, 'sine', 0.08, time);
        }

        // --- Drums ---
        if (step % 4 === 0) {
            this.playDrum('kick', time);
        }

        if (step % 8 === 4) {
            this.playDrum('snare', time);
        }

        if (step % 2 !== 0) {
            this.playDrum('hat', time);
        }
    }

    playSynthNote(freq, duration, type, vol, time) {
        if (!this.context || this.context.state !== 'running') return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(vol * this.masterVolume * GameConfig.AUDIO.MUSIC_VOLUME_MULTIPLIER, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start(time);
        osc.stop(time + duration + 0.1);
    }

    playDrum(type, time) {
        if (!this.context || this.context.state !== 'running') return;

        const drums = this.drumConfig;

        if (type === 'kick') {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.frequency.setValueAtTime(drums.KICK_FREQ_START, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + drums.KICK_DURATION);
            gain.gain.setValueAtTime(drums.KICK_VOLUME * this.masterVolume, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + drums.KICK_DURATION);
            osc.connect(gain);
            gain.connect(this.context.destination);
            osc.start(time);
            osc.stop(time + drums.KICK_DURATION);
        } else if (type === 'snare') {
            const noise = this.context.createBufferSource();
            const buffer = this.context.createBuffer(1, this.context.sampleRate * drums.SNARE_DURATION, this.context.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
            noise.buffer = buffer;
            const gain = this.context.createGain();
            gain.gain.setValueAtTime(drums.SNARE_VOLUME * this.masterVolume, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + drums.SNARE_DURATION);
            noise.connect(gain);
            gain.connect(this.context.destination);
            noise.start(time);
        } else if (type === 'hat') {
            const noise = this.context.createBufferSource();
            const buffer = this.context.createBuffer(1, this.context.sampleRate * drums.HAT_DURATION, this.context.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
            noise.buffer = buffer;

            const filter = this.context.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = drums.HAT_HIGHPASS_FREQ;

            const gain = this.context.createGain();
            gain.gain.setValueAtTime(drums.HAT_VOLUME * this.masterVolume, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + drums.HAT_DURATION);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.context.destination);
            noise.start(time);
        }
    }

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }
}
