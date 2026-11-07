import { GameConfig } from '../Config.js';

// Shared AudioContext across all SoundManager instances to avoid conflicts with Phaser
let sharedAudioContext = null;

function getSharedAudioContext() {
    if (!sharedAudioContext) {
        try {
            sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('SoundManager: Failed to create AudioContext:', e);
            return null;
        }
    }
    return sharedAudioContext;
}

export default class SoundManager {
    constructor(scene, level = 1) {
        this.scene = scene;
        this.level = level;
        // Use our own AudioContext instead of Phaser's to avoid "cut" errors
        this.context = getSharedAudioContext();
        this.masterVolume = GameConfig.AUDIO.MASTER_VOLUME;

        // Music state
        this.isMusicPlaying = false;
        this.musicTimer = null;
        this.stepIndex = 0;
        this.nextNoteTime = 0;
        this.chords = null;
        this.melodies = {};  // Store all melody sections
        this.sections = null;
        this.sectionIndex = 0;
        this.measureCount = 0;
        this.measuresPerSection = 4;

        // Sound definitions from config
        this.soundDefs = GameConfig.AUDIO.SOUNDS;

        // Music config from centralized settings
        this.musicConfig = GameConfig.AUDIO.MUSIC;

        // Load sound theme and palette for this level
        this.loadTheme(level);
    }

    loadTheme(level) {
        const worldIndex = Math.min(12, Math.max(1, Math.floor((level - 1) / 5) + 1));
        const isBoss = [10, 20, 30, 40, 50, 60].includes(level);
        const worldTheme = this.musicConfig?.WORLD_THEMES?.[worldIndex];

        if (worldTheme) {
            this.tempo = (worldTheme.tempo || 80) + (isBoss ? 8 : 0);
            this.chords = worldTheme.chords;
            this.melodies = {
                A: worldTheme.melodies.A,
                B: worldTheme.melodies.B || worldTheme.melodies.A,
                C: worldTheme.melodies.A,
                D: worldTheme.melodies.B || worldTheme.melodies.A
            };
            this.sections = ['A', 'B', 'A', 'B'];
            this.measuresPerSection = 4;
            this.palette = isBoss && worldTheme.bossPalette ? worldTheme.bossPalette : worldTheme.palette;
        } else {
            this.tempo = this.musicConfig?.TEMPO || 80;
            this.chords = this.musicConfig?.CHORDS || [];
            this.melodies = {
                A: this.musicConfig?.MELODY_A || [],
                B: this.musicConfig?.MELODY_B || [],
                C: this.musicConfig?.MELODY_C || [],
                D: this.musicConfig?.MELODY_D || []
            };
            this.sections = this.musicConfig?.SECTIONS || ['A'];
            this.measuresPerSection = this.musicConfig?.MEASURES_PER_SECTION || 4;
            this.loadPalette(level);
        }
    }

    loadPalette(level) {
        const palettes = this.musicConfig?.PALETTES;
        const levelPalettes = this.musicConfig?.LEVEL_PALETTES;

        if (!palettes || !levelPalettes) {
            // Fallback to default chiptune sounds
            this.palette = {
                bass: { type: 'triangle', vol: 0.8 },
                arp: { type: 'square', vol: 0.3 },
                melody: { type: 'square', vol: 0.6 }
            };
            return;
        }

        const paletteName = levelPalettes[level] || 'chiptune';
        this.palette = palettes[paletteName] || palettes.chiptune;
    }

    play(key, cascadeLevel = 1) {
        if (!this.scene?.sound) return;
        if (this.scene.sound.mute || localStorage.getItem('sugarSplash_sound') === 'false') return;
        if (!this.ensureContextRunning()) return;

        this.playSynth(key, cascadeLevel);
    }

    // Ensure AudioContext is running (handles browser autoplay policies)
    ensureContextRunning() {
        if (!this.context) {
            this.context = getSharedAudioContext();
            if (!this.context) return false;
        }

        if (this.context.state === 'suspended') {
            this.context.resume().catch(err => {
                console.warn('SoundManager: Failed to resume AudioContext:', err);
            });
            // Return false on first attempt when suspended - sound will play on next interaction
            return false;
        }

        return this.context.state === 'running';
    }

    playSynth(key, cascadeLevel = 1) {
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

        // Ascending C-major scale multiplier for match/cascade combos
        let pitchMultiplier = 1;
        if ((key === 'match' || key === 'cascade') && cascadeLevel >= 1) {
            const majorScale = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8, 2, 9 / 4, 5 / 2];
            const idx = Math.min(Math.max(0, cascadeLevel - 1), majorScale.length - 1);
            // Use 'match' base C5 frequency so cascade 1..10 climbs smoothly from C5 to E6
            const baseDef = this.soundDefs.match || def;
            this.playTone(baseDef, majorScale[idx]);
            // Add harmonic shimmer on combo cascades (2x+)
            if (cascadeLevel > 1) {
                this.playTone({
                    type: 'triangle',
                    freqStart: baseDef.freqStart * majorScale[idx] * 1.5,
                    freqEnd: baseDef.freqEnd * majorScale[idx] * 1.5,
                    duration: 0.18,
                    vol: 0.12
                }, 1);
            }
            return;
        }

        // Single Tone
        this.playTone(def, pitchMultiplier);
    }

    playTone(def, pitchMultiplier = 1) {
        if (!this.context || this.context.state !== 'running') return;

        const t = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = def.type || 'sine';
        
        // Frequency Envelope
        osc.frequency.setValueAtTime(def.freqStart * pitchMultiplier, t);
        if (def.freqEnd) {
            if (def.slide) {
                osc.frequency.linearRampToValueAtTime(def.freqEnd * pitchMultiplier, t + def.duration);
            } else {
                osc.frequency.exponentialRampToValueAtTime(def.freqEnd * pitchMultiplier, t + def.duration);
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
        if (!this.context || !this.musicConfig) return;
        if (!this.ensureContextRunning()) {
            setTimeout(() => this.startMusic(), 100);
            return;
        }

        this.isMusicPlaying = true;
        this.nextNoteTime = this.context.currentTime + 0.1;
        this.stepIndex = 0;
        this.loadTheme(this.level);
        this.secondsPerStep = 60 / this.tempo / 4; // 16th notes
        this.sectionIndex = 0;
        this.measureCount = 0;

        this.scheduleNextStep();
    }

    scheduleNextStep() {
        if (!this.isMusicPlaying) return;
        if (!this.context || this.context.state !== 'running') {
            this.stopMusic();
            return;
        }

        while (this.nextNoteTime < this.context.currentTime + 0.1) {
            this.playStep(this.nextNoteTime);
            this.nextNoteTime += this.secondsPerStep;
            this.stepIndex++;
        }

        this.musicTimer = setTimeout(() => this.scheduleNextStep(), 25);
    }

    playStep(time) {
        if (!this.scene || localStorage.getItem('sugarSplash_music') === 'false') return;
        if (!this.context || this.context.state !== 'running') return;
        if (!this.chords || this.chords.length === 0) return;

        const beatsPerChord = 16; // One chord per measure (16 sixteenth notes)
        const beatsPerMeasure = beatsPerChord * this.chords.length; // Full chord progression
        const chordIndex = Math.floor(this.stepIndex / beatsPerChord) % this.chords.length;
        const step = this.stepIndex % beatsPerChord;
        const chord = this.chords[chordIndex];

        if (!chord) return;

        // Track measure completion for section changes
        if (this.stepIndex > 0 && this.stepIndex % beatsPerMeasure === 0) {
            this.measureCount++;
            // Check if we should advance to next section
            if (this.measureCount >= this.measuresPerSection) {
                this.measureCount = 0;
                this.sectionIndex = (this.sectionIndex + 1) % this.sections.length;
            }
        }

        // Select melody and arpeggio style based on current section
        const currentSection = this.sections[this.sectionIndex] || 'A';
        const melody = this.melodies[currentSection] || this.melodies.A;

        // Select arpeggio pattern based on section for variety
        let arpKey = 'arp';
        if (currentSection === 'B' || currentSection === 'D') {
            arpKey = 'arp_alt';  // Descending arpeggios for B and D sections
        } else if (currentSection === 'C') {
            arpKey = 'arp_bounce';  // Bouncy arpeggios for playful C section
        }
        const arp = chord[arpKey] || chord.arp;

        const vol = GameConfig.AUDIO.MUSIC_VOLUME_MULTIPLIER * 0.5;

        // Get instrument settings from palette
        const bassSettings = this.palette?.bass || { type: 'triangle', vol: 0.8 };
        const arpSettings = this.palette?.arp || { type: 'square', vol: 0.3 };
        const melodySettings = this.palette?.melody || { type: 'square', vol: 0.6 };

        // --- Bass on beats 0 and 8 ---
        if (step === 0 || step === 8) {
            this.playChipNote(chord.bass, 0.4, bassSettings.type, vol * bassSettings.vol, time);
        }

        // --- Arpeggiated chord ---
        // Play arpeggio notes on steps 0,2,4,6,8,10,12,14 (8th notes)
        if (step % 2 === 0 && arp) {
            const arpIndex = (step / 2) % arp.length;
            this.playChipNote(arp[arpIndex], 0.15, arpSettings.type, vol * arpSettings.vol, time);
        }

        // --- Melody ---
        // Play melody on steps 0,4,8,12 (quarter notes)
        if (step % 4 === 0 && melody && melody.length > 0) {
            const melodyIndex = (this.stepIndex / 4) % melody.length;
            const melodyNote = melody[melodyIndex];
            if (melodyNote > 0) { // -1 = rest
                this.playChipNote(melodyNote, 0.35, melodySettings.type, vol * melodySettings.vol, time);
            }
        }
    }

    // Play a chiptune-style note with slight attack/decay envelope
    playChipNote(freq, duration, type, vol, time) {
        if (!this.context || this.context.state !== 'running') return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        // Chiptune envelope: quick attack, sustain, quick release
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(vol * this.masterVolume, time + 0.01);
        gain.gain.setValueAtTime(vol * this.masterVolume, time + duration - 0.02);
        gain.gain.linearRampToValueAtTime(0, time + duration);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start(time);
        osc.stop(time + duration + 0.01);
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

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
        // Clear references
        this.chords = null;
        this.melodies = {};
        this.sections = null;
        this.stepIndex = 0;
        this.nextNoteTime = 0;
        this.sectionIndex = 0;
        this.measureCount = 0;
    }

    // Clean up when scene is destroyed
    destroy() {
        this.stopMusic();
        this.context = null;
        this.scene = null;
        this.soundDefs = null;
        this.musicConfig = null;
    }
}
