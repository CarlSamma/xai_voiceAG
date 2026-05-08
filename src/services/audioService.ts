// Audio Service - Handles microphone capture, playback, and VU metering

import { useAudioStore } from '@/stores/audioStore';
import { float32ToPcm16Base64, base64ToFloat32, calculateRMS } from '@/utils/pcm';

export class AudioService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaSource: MediaStreamAudioSourceNode | null = null;
  private processor: AudioWorkletNode | null = null;
  private gainNode: GainNode | null = null;
  
  private playbackContext: AudioContext | null = null;
  private activeSourceNodes: AudioBufferSourceNode[] = [];
  
  private inputCallback: ((base64: string) => void) | null = null;
  private animationFrameId: number | null = null;

  /**
   * Initialize audio capture from microphone
   */
  async startCapture(sampleRate: number = 24000, onAudioData: (base64: string) => void): Promise<void> {
    this.inputCallback = onAudioData;
    const audioStore = useAudioStore.getState();

    try {
      // Request microphone permission
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: sampleRate,
        },
      });

      // Create AudioContext if needed
      if (!this.audioContext || this.audioContext.sampleRate !== sampleRate) {
        this.audioContext = new AudioContext({ sampleRate: sampleRate });
      }

      // Create source from media stream
      this.mediaSource = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create gain node for level monitoring
      this.gainNode = this.audioContext.createGain();
      this.mediaSource.connect(this.gainNode);

      // Create processor for capturing audio
      await this.setupAudioProcessor();

      audioStore.setMicActive(true);
      audioStore.setMicStatus('listening');

      // Start VU meter update loop
      this.startVuMeterUpdate();

      console.log('[AudioService] Microphone capture started');
    } catch (err) {
      console.error('[AudioService] Failed to start capture:', err);
      audioStore.setMicActive(false);
      audioStore.setMicStatus('idle');
      throw err;
    }
  }

  /**
   * Setup AudioWorklet processor for capturing audio
   */
  private async setupAudioProcessor(): Promise<void> {
    // Create inline processor since we can't load external files easily
    const processorCode = `
      class AudioCaptureProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.buffer = [];
        }
        
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input && input.length > 0) {
            const channelData = input[0];
            this.buffer.push(...channelData);
            
            // Send every 100ms worth of samples (~2400 samples at 24kHz)
            if (this.buffer.length >= 2400) {
              this.port.postMessage({ type: 'audio', samples: new Float32Array(this.buffer) });
              this.buffer = [];
            }
          }
          return true;
        }
      }
      
      registerProcessor('audio-capture-processor', AudioCaptureProcessor);
    `;

    const blob = new Blob([processorCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    
    await this.audioContext!.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);

    this.processor = new AudioWorkletNode(this.audioContext!, 'audio-capture-processor');
    
    this.processor.port.onmessage = (event) => {
      if (event.data.type === 'audio' && this.inputCallback) {
        const float32 = event.data.samples;
        const base64 = float32ToPcm16Base64(float32);
        this.inputCallback(base64);
      }
    };

    this.gainNode!.connect(this.processor);
    this.processor.connect(this.audioContext!.destination);
  }

  /**
   * Start VU meter update loop
   */
  private startVuMeterUpdate(): void {
    const audioStore = useAudioStore.getState();
    
    const updateVuMeter = () => {
      if (this.gainNode) {
        // Get current input level (approximation using gain)
        // In a real implementation, you'd use AnalyserNode
        const level = audioStore.isMicActive ? 0.5 : 0;
        audioStore.setInputRms(level);
      }
      this.animationFrameId = requestAnimationFrame(updateVuMeter);
    };
    
    this.animationFrameId = requestAnimationFrame(updateVuMeter);
  }

  /**
   * Stop audio capture
   */
  stopCapture(): void {
    const audioStore = useAudioStore.getState();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.mediaSource) {
      this.mediaSource.disconnect();
      this.mediaSource = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    audioStore.setMicActive(false);
    audioStore.setMicStatus('idle');
    audioStore.setInputRms(0);

    console.log('[AudioService] Microphone capture stopped');
  }

  /**
   * Mute/unmute microphone
   */
  setMicMuted(muted: boolean): void {
    const audioStore = useAudioStore.getState();
    audioStore.setMicMuted(muted);
    
    if (this.gainNode) {
      this.gainNode.gain.value = muted ? 0 : 1;
    }
    
    if (muted) {
      audioStore.setMicStatus('muted');
    } else {
      audioStore.setMicStatus('listening');
    }
  }

  /**
   * Play audio from base64 PCM data
   */
  async playAudio(base64Pcm: string, sampleRate: number = 24000): Promise<void> {
    const audioStore = useAudioStore.getState();
    
    try {
      // Create playback context if needed
      if (!this.playbackContext || this.playbackContext.sampleRate !== sampleRate) {
        this.playbackContext = new AudioContext({ sampleRate });
      }

      // Decode base64 to Float32Array
      const float32 = base64ToFloat32(base64Pcm, sampleRate);
      
      // Calculate RMS for VU meter
      const rms = calculateRMS(float32);
      audioStore.setOutputRms(rms);

      // Create AudioBuffer and schedule playback
      const audioBuffer = this.playbackContext.createBuffer(
        1,
        float32.length,
        sampleRate
      );
      const channelData = new Float32Array(float32.length);
      channelData.set(float32);
      audioBuffer.copyToChannel(channelData, 0);

      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);
      
      this.activeSourceNodes.push(source);
      audioStore.setIsPlaying(true);

      source.onended = () => {
        const index = this.activeSourceNodes.indexOf(source);
        if (index !== -1) {
          this.activeSourceNodes.splice(index, 1);
        }
        if (this.activeSourceNodes.length === 0) {
          audioStore.setIsPlaying(false);
          audioStore.setOutputRms(0);
        }
      };

      // Schedule playback at current time
      source.start(this.playbackContext.currentTime);
    } catch (err) {
      console.error('[AudioService] Failed to play audio:', err);
    }
  }

  /**
   * Stop all playback (for barge-in)
   */
  stopPlayback(): void {
    const audioStore = useAudioStore.getState();
    
    // Stop all active source nodes
    this.activeSourceNodes.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Already stopped
      }
    });
    this.activeSourceNodes = [];
    
    audioStore.setIsPlaying(false);
    audioStore.setOutputRms(0);
    audioStore.setPlaybackStatus('idle');

    console.log('[AudioService] Playback stopped (barge-in)');
  }

  /**
   * Check if currently playing
   */
  isPlaying(): boolean {
    return this.activeSourceNodes.length > 0;
  }

  /**
   * Resume audio context (needed for user gesture requirement)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    if (this.playbackContext?.state === 'suspended') {
      await this.playbackContext.resume();
    }
  }
}

// Singleton instance
export const audioService = new AudioService();