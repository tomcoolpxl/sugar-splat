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
        this.currentNoteIndex = 0;

        // Simple Pentatonic melody loop
        const melody = [
            261.63, 293.66, 329.63, 392.00, 440.00, // C4 D4 E4 G4 A4
            493.88, 523.25, 440.00, 392.00, 329.63  // B4 C5 A4 G4 E4
        ];
        
        const playNextNote = () => {
            if (!this.isMusicPlaying || this.scene.sound.mute) {
                this.musicTimer = setTimeout(playNextNote, 500);
                return;
            }

            const freq = melody[this.currentNoteIndex];
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.context.currentTime);

            // Very soft background volume
            const volume = 0.02 * this.masterVolume;
            gain.gain.setValueAtTime(0, this.context.currentTime);
            gain.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.1);
            gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(this.context.destination);

            osc.start();
            osc.stop(this.context.currentTime + 0.5);

            this.currentNoteIndex = (this.currentNoteIndex + 1) % melody.length;
            this.musicTimer = setTimeout(playNextNote, 500);
        };

        playNextNote();
    }

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }
}
