// Session Store - Manages WebSocket connection state and configuration

import { create } from 'zustand';
import type { SessionConfig, SessionStatus, Tool } from '@/types/session';
import { DEFAULT_SESSION_CONFIG } from '@/types/session';

interface SessionState {
  status: SessionStatus;
  config: SessionConfig;
  apiKey: string;
  reconnectAttempt: number;
  lastError: string | null;
  
  // Actions
  setStatus: (status: SessionStatus) => void;
  setConfig: (config: Partial<SessionConfig>) => void;
  setApiKey: (apiKey: string) => void;
  setReconnectAttempt: (attempt: number) => void;
  setLastError: (error: string | null) => void;
  incrementReconnectAttempt: () => void;
  resetReconnectAttempt: () => void;
  applyJsonConfig: (raw: string) => void;
  addTool: (tool: Tool) => void;
  removeTool: (index: number) => void;
  updateTool: (index: number, tool: Tool) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  status: 'IDLE',
  config: { ...DEFAULT_SESSION_CONFIG },
  apiKey: '',
  reconnectAttempt: 0,
  lastError: null,

  setStatus: (status) => set({ status }),
  
  setConfig: (config) => set((state) => ({
    config: { ...state.config, ...config }
  })),
  
  setApiKey: (apiKey) => set({ apiKey }),
  
  setReconnectAttempt: (attempt) => set({ reconnectAttempt: attempt }),
  
  setLastError: (error) => set({ lastError: error }),
  
  incrementReconnectAttempt: () => set((state) => ({
    reconnectAttempt: state.reconnectAttempt + 1
  })),
  
  resetReconnectAttempt: () => set({ reconnectAttempt: 0 }),
  
  applyJsonConfig: (raw) => {
    try {
      const parsed = JSON.parse(raw);
      set((state) => ({
        config: { ...state.config, ...parsed }
      }));
    } catch (e) {
      console.error('Invalid JSON config:', e);
    }
  },
  
  addTool: (tool) => set((state) => ({
    config: {
      ...state.config,
      tools: [...state.config.tools, tool]
    }
  })),
  
  removeTool: (index) => set((state) => ({
    config: {
      ...state.config,
      tools: state.config.tools.filter((_, i) => i !== index)
    }
  })),
  
  updateTool: (index, tool) => set((state) => ({
    config: {
      ...state.config,
      tools: state.config.tools.map((t, i) => i === index ? tool : t)
    }
  })),
  
  reset: () => set({
    config: { ...DEFAULT_SESSION_CONFIG },
    reconnectAttempt: 0,
    lastError: null,
  }),
}));