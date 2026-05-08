// Log Store - Manages event log for WebSocket observability

import { create } from 'zustand';
import type { LogEntry, LogCategory } from '@/types/session';

interface LogState {
  entries: LogEntry[];
  
  // Actions
  addEntry: (entry: Omit<LogEntry, 'id' | 'ts'>) => void;
  clear: () => void;
  getAllJson: () => string;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useLogStore = create<LogState>((set, get) => ({
  entries: [],

  addEntry: (entry) => {
    const newEntry: LogEntry = {
      ...entry,
      id: generateId(),
      ts: Date.now(),
    };
    set((state) => ({
      entries: [...state.entries, newEntry],
    }));
  },

  clear: () => set({ entries: [] }),

  getAllJson: () => {
    return get().entries.map((e) => JSON.stringify(e)).join('\n');
  },
}));

// Helper function to determine log category from event type
export function getLogCategory(eventType: string): LogCategory {
  if (eventType.startsWith('response.output_audio') || eventType === 'input_audio_buffer.append') {
    return 'audio';
  }
  if (eventType.startsWith('response.function_call') || eventType === 'mcp_') {
    return 'function';
  }
  if (eventType === 'error') {
    return 'error';
  }
  if (eventType.includes('session') || eventType.includes('conversation')) {
    return 'session';
  }
  return 'status';
}

// Helper function to create event summary
export function getEventSummary(eventType: string, data: Record<string, unknown>): string {
  switch (eventType) {
    case 'session.created':
      return 'Session created';
    case 'session.updated':
      return 'Session configuration updated';
    case 'input_audio_buffer.append':
      return 'Audio data sent';
    case 'response.output_audio.delta':
      return 'Audio response received';
    case 'response.output_audio.done':
      return 'Audio response complete';
    case 'response.text.delta':
      return `Text response: ${data.delta || ''}`;
    case 'response.done':
      return 'Response generation complete';
    case 'conversation.item.input_audio_transcription.completed':
      return `User transcription: ${data.transcription || ''}`;
    case 'response.function_call_arguments.done':
      return `Function call: ${data.name || ''}`;
    case 'error':
      return `Error: ${(data.error as Record<string, string>)?.message || 'Unknown'}`;
    default:
      return eventType;
  }
}