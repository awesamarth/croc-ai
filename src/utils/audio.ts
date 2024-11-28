// src/utils/audio.ts
export class AudioFeedback {
    private startSound: AudioBuffer | null = null;
    private endSound: AudioBuffer | null = null;
    private audioContext: AudioContext | null = null;
  
    constructor() {
      // Create AudioContext on first user interaction to comply with Chrome's autoplay policy
      this.initializeAudioContext();
    }
  
    private initializeAudioContext() {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
        // Load both sounds when AudioContext is created
        this.loadSounds();
      }
    }
  
    private async loadSounds() {
      try {
        const startResponse = await fetch(chrome.runtime.getURL('assets/start.mp3'));
        const endResponse = await fetch(chrome.runtime.getURL('assets/end.mp3'));
        
        const startBuffer = await startResponse.arrayBuffer();
        const endBuffer = await endResponse.arrayBuffer();
        
        this.startSound = await this.audioContext!.decodeAudioData(startBuffer);
        this.endSound = await this.audioContext!.decodeAudioData(endBuffer);
      } catch (error) {
        console.error('Error loading audio files:', error);
      }
    }
  
    async playStartSound() {
      if (!this.audioContext || !this.startSound) return;
      const source = this.audioContext.createBufferSource();
      source.buffer = this.startSound;
      source.connect(this.audioContext.destination);
      source.start();
    }
  
    async playEndSound() {
      if (!this.audioContext || !this.endSound) return;
      const source = this.audioContext.createBufferSource();
      source.buffer = this.endSound;
      source.connect(this.audioContext.destination);
      source.start();
    }
  }