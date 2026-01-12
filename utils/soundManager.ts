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
}

export const soundManager = new SoundManager();
