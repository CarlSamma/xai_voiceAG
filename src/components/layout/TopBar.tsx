// TopBar Component - Connection status and controls

import { Mic, MicOff, Volume2, VolumeX, RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import type { SessionStatus } from '@/types/session';
import { VUMeter } from '@/components/voice/VUMeter';

interface TopBarProps {
  status: SessionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  onReset: () => void;
  onRetry: () => void;
  inputRms: number;
  outputRms: number;
  micStatus: 'idle' | 'listening' | 'vad_active' | 'muted';
  playbackStatus: 'idle' | 'playing' | 'buffering';
}

export function TopBar({
  status,
  onConnect,
  onDisconnect,
  onReset,
  onRetry,
  inputRms,
  outputRms,
  micStatus,
  playbackStatus,
}: TopBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'CONNECTED':
        return 'text-xai-success';
      case 'CONNECTING':
      case 'RECONNECTING':
        return 'text-xai-warning';
      case 'ERROR':
        return 'text-xai-error';
      default:
        return 'text-xai-text-muted';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'IDLE':
        return 'Disconnected';
      case 'CONNECTING':
        return 'Connecting...';
      case 'CONNECTED':
        return 'Connected';
      case 'RECONNECTING':
        return 'Reconnecting...';
      case 'RESETTING':
        return 'Resetting...';
      case 'ERROR':
        return 'Error';
      default:
        return status;
    }
  };

  const getMicIcon = () => {
    switch (micStatus) {
      case 'muted':
        return <MicOff className="w-4 h-4 text-xai-error" />;
      case 'vad_active':
        return <Mic className="w-4 h-4 text-xai-warning animate-pulse" />;
      case 'listening':
        return <Mic className="w-4 h-4 text-xai-success" />;
      default:
        return <Mic className="w-4 h-4 text-xai-text-muted" />;
    }
  };

  const getPlaybackIcon = () => {
    switch (playbackStatus) {
      case 'playing':
        return <Volume2 className="w-4 h-4 text-xai-success animate-pulse" />;
      case 'buffering':
        return <Volume2 className="w-4 h-4 text-xai-warning" />;
      default:
        return <VolumeX className="w-4 h-4 text-xai-text-muted" />;
    }
  };

  return (
    <header className="bg-xai-darker border-b border-xai-border px-4 py-3 flex items-center justify-between">
      {/* Left - Status */}
      <div className="flex items-center gap-4">
        {/* Status Icon */}
        <div className={`flex items-center gap-2 ${getStatusColor()}`}>
          {status === 'CONNECTED' ? (
            <Wifi className="w-5 h-5" />
          ) : status === 'ERROR' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <WifiOff className="w-5 h-5" />
          )}
          <span className="font-medium">{getStatusText()}</span>
        </div>

        {/* Reconnect Attempt (if reconnecting) */}
        {status === 'RECONNECTING' && (
          <div className="flex items-center gap-2 text-xai-warning">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Attempting to reconnect...</span>
          </div>
        )}

        {/* Model Badge */}
        <div className="bg-xai-accent/20 text-xai-accent px-3 py-1 rounded-full text-xs font-medium">
          grok-voice-think-fast-1.0
        </div>
      </div>

      {/* Center - VU Meters */}
      <div className="flex items-center gap-6">
        {/* Input VU Meter */}
        <div className="flex items-center gap-2">
          {getMicIcon()}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-xai-text-muted">Input</span>
            <VUMeter level={inputRms} color="green" />
          </div>
          <span className="text-xs text-xai-text-muted capitalize">{micStatus.replace('_', ' ')}</span>
        </div>

        {/* Output VU Meter */}
        <div className="flex items-center gap-2">
          {getPlaybackIcon()}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-xai-text-muted">Output</span>
            <VUMeter level={outputRms} color="blue" />
          </div>
          <span className="text-xs text-xai-text-muted capitalize">{playbackStatus}</span>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        {status === 'IDLE' || status === 'ERROR' ? (
          <button
            onClick={status === 'ERROR' ? onRetry : onConnect}
            className="bg-xai-accent hover:bg-xai-accent-hover text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {status === 'ERROR' ? 'Retry Connection' : 'Connect'}
          </button>
        ) : (
          <>
            <button
              onClick={onReset}
              disabled={status !== 'CONNECTED'}
              className="bg-xai-border hover:bg-xai-text-muted text-xai-text px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4 inline mr-1" />
              Reset
            </button>
            <button
              onClick={onDisconnect}
              className="bg-xai-error/20 hover:bg-xai-error/30 text-xai-error px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Disconnect
            </button>
          </>
        )}
      </div>
    </header>
  );
}