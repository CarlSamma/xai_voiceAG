// Main App Component

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { CenterPanel } from '@/components/layout/CenterPanel';
import { RightPanel } from '@/components/layout/RightPanel';
import { LogDrawer } from '@/components/layout/LogDrawer';
import { useSessionStore } from '@/stores/sessionStore';
import { useAudioStore } from '@/stores/audioStore';
import { useTranscriptStore } from '@/stores/transcriptStore';
import { useLogStore } from '@/stores/logStore';
import { wsService } from '@/services/wsService';
import { audioService } from '@/services/audioService';
import { handleFunctionCall } from '@/services/functionRegistry';

function App() {
  const { status, config, apiKey, setStatus, reset: resetSession } = useSessionStore();
  const audioStore = useAudioStore();
  const transcriptStore = useTranscriptStore();
  const logStore = useLogStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register WebSocket event handlers
  useEffect(() => {
    // Handle audio delta - play audio
    wsService.on('response.output_audio.delta', (event) => {
      const audioData = (event as { audio: string }).audio;
      audioService.playAudio(audioData, config.audio.output.format.rate || 24000);
    });

    // Handle function calls
    wsService.on('response.function_call_arguments.done', (event) => {
      const e = event as { call_id: string; name: string; arguments: string };
      handleFunctionCall(e);
    });

    // Handle response done - resolve playback
    wsService.on('response.done', () => {
      audioStore.setPlaybackStatus('idle');
    });

    return () => {
      wsService.off('response.output_audio.delta');
      wsService.off('response.function_call_arguments.done');
      wsService.off('response.done');
    };
  }, [config.audio.output.format.rate]);

  // Handle connect
  const handleConnect = async () => {
    if (!apiKey) {
      alert('Please enter your API key');
      return;
    }

    if (!isOnline) {
      alert('No internet connection. Please check your network and try again.');
      return;
    }

    try {
      // Resume audio context (needed for user gesture)
      await audioService.resume();
      
      // Start microphone capture
      const sampleRate = config.audio.input.format.rate || 24000;
      await audioService.startCapture(sampleRate, (base64) => {
        if (wsService.isConnected()) {
          wsService.appendAudio(base64);
        } else {
          // Buffer audio while connecting
          audioStore.addToEarlyBuffer(new Float32Array());
        }
      });

      // Connect WebSocket
      wsService.connect(apiKey, config);
    } catch (err) {
      console.error('Failed to connect:', err);
      setStatus('ERROR');
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    wsService.disconnect();
    audioService.stopCapture();
    setStatus('IDLE');
  };

  // Handle reset
  const handleReset = () => {
    // Clear transcript
    transcriptStore.clear();
    
    // Clear log
    logStore.clear();
    
    // Reset audio state
    audioStore.reset();
    
    // Clear audio buffer
    audioService.stopPlayback();
    
    // Send session update to reset session on server
    if (wsService.isConnected()) {
      wsService.sendSessionUpdate(config);
    }
    
    setStatus('CONNECTED');
  };

  // Handle reconnect attempt
  const handleRetry = () => {
    if (apiKey) {
      wsService.connect(apiKey, config);
    }
  };

  return (
    <div className="h-full flex flex-col bg-xai-dark">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-xai-warning text-black px-4 py-2 text-center text-sm font-medium">
          No internet connection — voice session requires network access
        </div>
      )}

      {/* Top Bar */}
      <TopBar
        status={status}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onReset={handleReset}
        onRetry={handleRetry}
        inputRms={audioStore.inputRms}
        outputRms={audioStore.outputRms}
        micStatus={audioStore.micStatus}
        playbackStatus={audioStore.playbackStatus}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Center Panel - Transcript */}
        <CenterPanel />

        {/* Right Panel - Settings */}
        <RightPanel />
      </div>

      {/* Log Drawer */}
      <LogDrawer />
    </div>
  );
}

export default App;