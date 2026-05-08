// Audio Store - Manages audio capture and playback state

import { create } from 'zustand';

interface AudioState {
  inputRms: number;
  outputRms: number;
  isPlaying: boolean;
  isMicActive: boolean;
  isMicMuted: boolean;
  micStatus: 'idle' | 'listening' | 'vad_active' | 'muted';
  playbackStatus: 'idle' | 'playing' | 'buffering';
  earlyAudioBuffer: Float32Array[];
  currentResponseId: string | null;
  
  // Actions
  setInputRms: (rms: number) => void;
  setOutputRms: (rms: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setMicActive: (active: boolean) => void;
  setMicMuted: (muted: boolean) => void;
  setMicStatus: (status: 'idle' | 'listening' | 'vad_active' | 'muted') => void;
  setPlaybackStatus: (status: 'idle' | 'playing' | 'buffering') => void;
  addToEarlyBuffer: (samples: Float32Array) => void;
  clearEarlyBuffer: () => void;
  setCurrentResponseId: (id: string | null) => void;
  reset: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  inputRms: 0,
  outputRms: 0,
  isPlaying: false,
  isMicActive: false,
  isMicMuted: false,
  micStatus: 'idle',
  playbackStatus: 'idle',
  earlyAudioBuffer: [],
  currentResponseId: null,

  setInputRms: (rms) => set({ inputRms: rms }),
  setOutputRms: (rms) => set({ outputRms: rms }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setMicActive: (active) => set({ isMicActive: active }),
  setMicMuted: (muted) => set({ isMicMuted: muted }),
  setMicStatus: (status) => set({ micStatus: status }),
  setPlaybackStatus: (status) => set({ playbackStatus: status }),
  
  addToEarlyBuffer: (samples) => set((state) => ({
    earlyAudioBuffer: [...state.earlyAudioBuffer, samples]
  })),
  
  clearEarlyBuffer: () => set({ earlyAudioBuffer: [] }),
  
  setCurrentResponseId: (id) => set({ currentResponseId: id }),
  
  reset: () => set({
    inputRms: 0,
    outputRms: 0,
    isPlaying: false,
    isMicActive: false,
    isMicMuted: false,
    micStatus: 'idle',
    playbackStatus: 'idle',
    earlyAudioBuffer: [],
    currentResponseId: null,
  }),
}));