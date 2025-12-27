export default class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.context = scene.sound.context; // Web Audio Context
        this.masterVolume = 0.3; // Global synth volume
        
        // Music state
        this.musicGain = null;
        this.musicOsc = null;
        this.isMusicPlaying = false;
        this.currentNoteIndex = 0;
        this.musicTimer = null;

        // Define sound types and their synth parameters
        this.soundDefs = {
            // UI / Interaction
            'select': { 
                type: 'sine', 
                freqStart: 880, 
                freqEnd: 1200, 
                duration: 0.05, 
                attack: 0.01,
                decay: 0.04 
            },
            'click': { 
                type: 'square', 
                freqStart: 400, 
                freqEnd: 600, 
                duration: 0.05, 
                vol: 0.1 
            },
            
            // Gameplay - Basic
            'swap': { 
                type: 'triangle', 
                freqStart: 300, 
                freqEnd: 600, 
                duration: 0.15,
                slide: true
            },
            'invalid': { 
                type: 'sawtooth', 
                freqStart: 150, 
                freqEnd: 80, 
                duration: 0.2, 
                vol: 0.15 
            },
            'match': { 
                type: 'sine', 
                freqStart: 523.25, // C5
                freqEnd: 1046.50, // C6
                duration: 0.15, 
                vol: 0.25 
            },
            'cascade': { 
                type: 'sine', 
                freqStart: 1046.50, // C6
                freqEnd: 2093.00, // C7
                duration: 0.2, 
                vol: 0.25 
            },

            // Gameplay - Specials
            'bomb': { 
                type: 'noise', 
                duration: 0.4, 
                vol: 0.4 
            },
            'line': { 
                type: 'sawtooth', 
                freqStart: 800, 
                freqEnd: 200, 
                duration: 0.3, 
                vol: 0.15,
                slide: true
            },

            // Jingles (Sequences)
            'win': {
                type: 'sequence',
                instrument: 'triangle',
                notes: [
                    { freq: 523.25, dur: 0.1, time: 0 },    // C5
                    { freq: 659.25, dur: 0.1, time: 0.1 },  // E5
                    { freq: 783.99, dur: 0.1, time: 0.2 },  // G5
                    { freq: 1046.50, dur: 0.4, time: 0.3 }  // C6
                ],
                vol: 0.2
            },
            'levelFail': {
                type: 'sequence',
                instrument: 'sawtooth',
                notes: [
                    { freq: 392.00, dur: 0.2, time: 0 },    // G4
                    { freq: 311.13, dur: 0.2, time: 0.2 },  // Eb4
                    { freq: 261.63, dur: 0.6, time: 0.4 }   // C4
                ],
                vol: 0.15
            }
        };
    }

    play(key) {
        if (this.scene.sound.mute) return;

        // Fallback to synth
        this.playSynth(key);
    }

    playSynth(key) {
        if (!this.context) return; 

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
        if (this.isMusicPlaying || !this.context) return;
        this.isMusicPlaying = true;
        this.nextNoteTime = this.context.currentTime + 0.1;
        this.stepIndex = 0;
        this.tempo = 110;
        this.secondsPerStep = 60 / this.tempo / 4; // 16th notes

        // Song Structure: Cm - Ab - Eb - Bb (i - VI - III - VII)
        // 16 steps per chord
        this.chordProgression = [
            { root: 130.81, name: 'Cm' }, // C3
            { root: 103.83, name: 'Ab' }, // Ab2
            { root: 155.56, name: 'Eb' }, // Eb3
            { root: 116.54, name: 'Bb' }  // Bb2
        ];

        this.scheduleNextStep();
    }

    scheduleNextStep() {
        if (!this.isMusicPlaying) return;

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

        const measure = Math.floor(this.stepIndex / 16);
        const step = this.stepIndex % 16;
        const currentChord = this.chordProgression[measure % this.chordProgression.length];
        const root = currentChord.root;

        // --- Bass (16th notes, pumping) ---
        // Play on off-beats or driving 8ths
        if (step % 2 === 0) {
            this.playSynthNote(root, 0.1, 'sawtooth', 0.1, time);
        } else {
            this.playSynthNote(root, 0.1, 'square', 0.05, time); // quieter off-beat
        }

        // --- Melody (Pentatonic riff) ---
        // C Minor Pentatonic: C, Eb, F, G, Bb
        // Relative to root
        const scale = [1, 1.2, 1.33, 1.5, 1.78]; // Approx intervals
        
        // Simple melody pattern
        if (step === 0 || step === 6 || step === 12) {
            const noteIdx = (measure + step) % scale.length;
            const freq = root * 2 * scale[noteIdx]; // Octave up
            this.playSynthNote(freq, 0.1, 'sine', 0.08, time);
        }

        // --- Drums ---
        // Kick on 1, 5, 9, 13 (4/4 feel)
        if (step % 4 === 0) {
            this.playDrum('kick', time);
        }
        
        // Snare on 5, 13 (Backbeat)
        if (step % 8 === 4) {
            this.playDrum('snare', time);
        }

        // Hi-hats on off-beats
        if (step % 2 !== 0) {
            this.playDrum('hat', time);
        }
    }

    playSynthNote(freq, duration, type, vol, time) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(vol * this.masterVolume * 0.4, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start(time);
        osc.stop(time + duration + 0.1);
    }

    playDrum(type, time) {
        if (type === 'kick') {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);
            gain.gain.setValueAtTime(0.4 * this.masterVolume, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            osc.connect(gain);
            gain.connect(this.context.destination);
            osc.start(time);
            osc.stop(time + 0.15);
        } else if (type === 'snare') {
            const noise = this.context.createBufferSource();
            const buffer = this.context.createBuffer(1, this.context.sampleRate * 0.1, this.context.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
            noise.buffer = buffer;
            const gain = this.context.createGain();
            gain.gain.setValueAtTime(0.2 * this.masterVolume, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
            noise.connect(gain);
            gain.connect(this.context.destination);
            noise.start(time);
        } else if (type === 'hat') {
            const noise = this.context.createBufferSource();
            const buffer = this.context.createBuffer(1, this.context.sampleRate * 0.05, this.context.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
            noise.buffer = buffer;
            
            // High pass filter for hat
            const filter = this.context.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 5000;

            const gain = this.context.createGain();
            gain.gain.setValueAtTime(0.1 * this.masterVolume, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            
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
