// WebSocket Service for xAI Realtime API

import type { XaiEvent, ServerEvent } from '@/types/xai';
import type { SessionConfig } from '@/types/session';
import { useSessionStore } from '@/stores/sessionStore';
import { useLogStore, getLogCategory, getEventSummary } from '@/stores/logStore';
import { useTranscriptStore } from '@/stores/transcriptStore';
import { useAudioStore } from '@/stores/audioStore';

const WS_ENDPOINT = 'wss://api.x.ai/v1/realtime';
const WS_MODEL = 'grok-voice-think-fast-1.0';

export class WsService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private eventHandlers: Map<string, (event: XaiEvent) => void> = new Map();

  /**
   * Connect to xAI Realtime WebSocket
   */
  connect(apiKey: string, sessionConfig: SessionConfig): void {
    const sessionStore = useSessionStore.getState();
    const logStore = useLogStore.getState();
    
    // Clean up existing connection
    this.disconnect();
    
    sessionStore.setStatus('CONNECTING');
    sessionStore.setApiKey(apiKey);
    
    // Create WebSocket with sub-protocol for authentication
    // Browser cannot send Authorization header on WebSocket, use sec-websocket-protocol
    this.ws = new WebSocket(
      `${WS_ENDPOINT}?model=${WS_MODEL}`,
      [`xai-client-secret.${apiKey}`]
    );

    this.ws.onopen = () => {
      console.log('[WsService] WebSocket connected');
      sessionStore.setStatus('CONNECTED');
      sessionStore.resetReconnectAttempt();
      
      // Log connection event
      logStore.addEntry({
        direction: 'in',
        type: 'connected',
        summary: 'WebSocket connected to xAI Realtime API',
        raw: { endpoint: WS_ENDPOINT, model: WS_MODEL },
        category: 'status',
      });
      
      // Send initial session configuration
      this.sendSessionUpdate(sessionConfig);
    };

    this.ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as XaiEvent;
        this.handleServerEvent(event);
      } catch (err) {
        console.error('[WsService] Failed to parse message:', err);
      }
    };

    this.ws.onclose = (ev) => {
      console.log('[WsService] WebSocket closed:', ev.code, ev.reason);
      
      // Log disconnection
      logStore.addEntry({
        direction: 'in',
        type: 'disconnected',
        summary: `WebSocket closed (code: ${ev.code})`,
        raw: { code: ev.code, reason: ev.reason },
        category: 'status',
      });
      
      // Handle unexpected close - attempt reconnect
      if (ev.code !== 1000 && sessionStore.status === 'CONNECTED') {
        this.handleReconnect();
      } else {
        sessionStore.setStatus('IDLE');
      }
    };

    this.ws.onerror = (err) => {
      console.error('[WsService] WebSocket error:', err);
      sessionStore.setLastError('WebSocket connection error');
      sessionStore.setStatus('ERROR');
      
      logStore.addEntry({
        direction: 'in',
        type: 'error',
        summary: 'WebSocket connection error',
        raw: { error: 'Connection failed' },
        category: 'error',
      });
    };
  }

  /**
   * Disconnect and clean up
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Send session.update to configure the session
   */
  sendSessionUpdate(config: SessionConfig): void {
    this.send({
      type: 'session.update',
      session: config,
    });
  }

  /**
   * Send audio data to the server
   */
  appendAudio(base64Pcm: string): void {
    this.send({
      type: 'input_audio_buffer.append',
      audio: base64Pcm,
    });
  }

  /**
   * Send function call output
   */
  sendFunctionOutput(callId: string, output: string): void {
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output,
      },
    });
  }

  /**
   * Request a new response from the model
   */
  requestResponse(): void {
    this.send({ type: 'response.create' });
  }

  /**
   * Cancel current response
   */
  cancelResponse(): void {
    this.send({ type: 'response.cancel' });
  }

  /**
   * Clear input audio buffer
   */
  clearAudioBuffer(): void {
    this.send({ type: 'input_audio_buffer.clear' });
  }

  /**
   * Send raw event
   */
  send(event: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
      
      // Log outgoing events
      const logStore = useLogStore.getState();
      const eventType = (event as { type: string }).type;
      logStore.addEntry({
        direction: 'out',
        type: eventType,
        summary: getEventSummary(eventType, event as Record<string, unknown>),
        raw: event,
        category: getLogCategory(eventType),
      });
    }
  }

  /**
   * Handle incoming server events
   */
  private handleServerEvent(event: XaiEvent): void {
    const logStore = useLogStore.getState();
    const sessionStore = useSessionStore.getState();
    const transcriptStore = useTranscriptStore.getState();
    const audioStore = useAudioStore.getState();

    // Log the event
    logStore.addEntry({
      direction: 'in',
      type: event.type,
      summary: getEventSummary(event.type, event as Record<string, unknown>),
      raw: event,
      category: getLogCategory(event.type),
    });

    // Handle specific events
    switch (event.type) {
      case 'session.created':
        console.log('[WsService] Session created:', event.session);
        sessionStore.setStatus('CONNECTED');
        break;

      case 'session.updated':
        console.log('[WsService] Session updated');
        break;

      case 'input_audio_buffer.speech_started':
        audioStore.setMicStatus('vad_active');
        break;

      case 'input_audio_buffer.speech_stopped':
        audioStore.setMicStatus('listening');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        transcriptStore.addUserMessage((event as { transcription: string }).transcription);
        break;

      case 'response.created':
        audioStore.setCurrentResponseId((event as { response: { id: string } }).response.id);
        audioStore.setPlaybackStatus('buffering');
        break;

      case 'response.output_audio.delta':
        // Audio data will be handled by audio service
        audioStore.setPlaybackStatus('playing');
        this.eventHandlers.get('audio_delta')?.(event);
        break;

      case 'response.output_audio.done':
        audioStore.setPlaybackStatus('idle');
        break;

      case 'response.text.delta':
        // Append text delta to last assistant message
        const delta = (event as { delta: string }).delta;
        const currentText = transcriptStore.messages.findLast((m) => m.role === 'assistant')?.text || '';
        transcriptStore.updateLastAssistantMessage(currentText + delta);
        break;

      case 'response.done':
        audioStore.setIsPlaying(false);
        audioStore.setPlaybackStatus('idle');
        this.eventHandlers.get('response_done')?.(event);
        break;

      case 'error':
        const error = (event as { error: { code: string; message: string } }).error;
        console.error('[WsService] Server error:', error);
        sessionStore.setLastError(`${error.code}: ${error.message}`);
        break;
    }

    // Call registered handlers
    this.eventHandlers.get(event.type)?.(event);
    this.eventHandlers.get('*')?.(event);
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: (event: XaiEvent) => void): void {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Remove event handler
   */
  off(eventType: string): void {
    this.eventHandlers.delete(eventType);
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    const sessionStore = useSessionStore.getState();
    
    if (sessionStore.reconnectAttempt >= 5) {
      sessionStore.setStatus('ERROR');
      sessionStore.setLastError('Max reconnection attempts reached');
      return;
    }

    sessionStore.setStatus('RECONNECTING');
    sessionStore.incrementReconnectAttempt();
    
    const attempt = sessionStore.reconnectAttempt;
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
    
    console.log(`[WsService] Reconnecting in ${delay}ms (attempt ${attempt}/5)`);
    
    this.reconnectTimeout = window.setTimeout(() => {
      const { apiKey, config } = sessionStore;
      if (apiKey) {
        this.connect(apiKey, config);
      }
    }, delay);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsService = new WsService();