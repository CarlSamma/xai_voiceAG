// Audio Hook - Combines audio service with store for React integration

import { useEffect, useCallback, useRef } from 'react';
import { audioService } from '@/services/audioService';
import { wsService } from '@/services/wsService';
import { useAudioStore } from '@/stores/audioStore';
import { useSessionStore } from '@/stores/sessionStore';

export function useAudio() {
  const audioStore = useAudioStore();
  const sessionStore = useSessionStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const startCapture = useCallback(async () => {
    if (sessionStore.status !== 'CONNECTED') return;

    const sampleRate = sessionStore.config.audio.input.format.rate || 24000;
    
    try {
      await audioService.startCapture(sampleRate, (base64) => {
        if (wsService.isConnected()) {
          wsService.appendAudio(base64);
        }
      });
    } catch (err) {
      console.error('Failed to start capture:', err);
    }
  }, [sessionStore.status, sessionStore.config.audio.input.format.rate]);

  const stopCapture = useCallback(() => {
    audioService.stopCapture();
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !audioStore.isMicMuted;
    audioService.setMicMuted(newMuted);
  }, [audioStore.isMicMuted]);

  const stopPlayback = useCallback(() => {
    audioService.stopPlayback();
  }, []);

  const playAudio = useCallback(async (base64: string, sampleRate?: number) => {
    const rate = sampleRate || sessionStore.config.audio.output.format.rate || 24000;
    await audioService.playAudio(base64, rate);
  }, [sessionStore.config.audio.output.format.rate]);

  const resume = useCallback(async () => {
    await audioService.resume();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioService.stopCapture();
      audioService.stopPlayback();
    };
  }, []);

  return {
    // State
    inputRms: audioStore.inputRms,
    outputRms: audioStore.outputRms,
    isPlaying: audioStore.isPlaying,
    isMicActive: audioStore.isMicActive,
    isMicMuted: audioStore.isMicMuted,
    micStatus: audioStore.micStatus,
    playbackStatus: audioStore.playbackStatus,
    
    // Actions
    startCapture,
    stopCapture,
    toggleMute,
    stopPlayback,
    playAudio,
    resume,
  };
}