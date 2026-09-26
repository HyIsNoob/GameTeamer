// Simple synth using Web Audio API to avoid external assets
class SoundManager {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;
    private masterGain: GainNode | null = null;
  
    constructor() {
      // Lazy init to comply with autoplay policies
      try {
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        if (AudioContextClass) {
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.3; // Default low volume
        }
      } catch (e) {
        console.error("Web Audio API not supported", e);
      }
    }
  
    setMute(muted: boolean) {
      this.isMuted = muted;
      if (this.masterGain) {
          this.masterGain.gain.value = muted ? 0 : 0.3;
      }
    }
  
    private ensureContext() {
       if (this.ctx && this.ctx.state === 'suspended') {
           this.ctx.resume();
       }
    }
  
    playTick() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        this.ensureContext();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        // High pitched short blip
        osc.frequency.setValueAtTime(800 + Math.random() * 200, this.ctx.currentTime);
        osc.type = 'square';
        
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playStart() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        this.ensureContext();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        // Charging up sound
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.5);
        osc.type = 'sawtooth';

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    playSuccess() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        this.ensureContext();
        
        // Major chord arpeggio
        [440, 554.37, 659.25, 880].forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            
            osc.connect(gain);
            gain.connect(this.masterGain!);
            
            const start = this.ctx!.currentTime + (i * 0.05);
            
            osc.frequency.setValueAtTime(freq, start);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.1, start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
            
            osc.start(start);
            osc.stop(start + 0.5);
        });
    }
    
    playClick() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        this.ensureContext();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playCoinToss() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        this.ensureContext();

        // Rapid metallic ringing clicks
        for (let i = 0; i < 8; i++) {
            const start = this.ctx.currentTime + (i * 0.08);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.frequency.setValueAtTime(1800 + (i * 60), start);
            osc.type = 'triangle';

            gain.gain.setValueAtTime(0.08, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.06);

            osc.start(start);
            osc.stop(start + 0.06);
        }
    }

    playBanSlam() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        this.ensureContext();

        // Deep heavy impact bass drop + harsh buzz
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }

    playLockIn() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        this.ensureContext();

        // Cyber lock-in chord
        [523.25, 659.25, 1046.5].forEach((freq, idx) => {
            const start = this.ctx!.currentTime + (idx * 0.04);
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.12, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

            osc.start(start);
            osc.stop(start + 0.3);
        });
    }

    playVictory() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        this.ensureContext();

        // Grand esports championship fanfare
        const notes = [
            { freq: 523.25, time: 0, dur: 0.2 },      // C5
            { freq: 659.25, time: 0.18, dur: 0.2 },   // E5
            { freq: 783.99, time: 0.36, dur: 0.25 },  // G5
            { freq: 1046.5, time: 0.58, dur: 0.8 },   // C6 long
            { freq: 1318.5, time: 0.62, dur: 0.75 }   // E6 harmonic
        ];

        notes.forEach((n) => {
            const start = this.ctx!.currentTime + n.time;
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n.freq, start);

            gain.gain.setValueAtTime(0.2, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + n.dur);

            osc.start(start);
            osc.stop(start + n.dur);
        });
    }
}

export const soundManager = new SoundManager();
