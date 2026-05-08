// Transcript Store - Manages conversation transcript

import { create } from 'zustand';
import type { TranscriptMessage } from '@/types/session';

interface TranscriptState {
  messages: TranscriptMessage[];
  
  // Actions
  addUserMessage: (text: string) => void;
  addAssistantMessage: (text: string) => void;
  updateLastAssistantMessage: (text: string) => void;
  clear: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useTranscriptStore = create<TranscriptState>((set) => ({
  messages: [],

  addUserMessage: (text) => set((state) => ({
    messages: [...state.messages, {
      id: generateId(),
      role: 'user',
      text,
      timestamp: Date.now(),
    }],
  })),

  addAssistantMessage: (text) => set((state) => ({
    messages: [...state.messages, {
      id: generateId(),
      role: 'assistant',
      text,
      timestamp: Date.now(),
    }],
  })),

  updateLastAssistantMessage: (text) => set((state) => {
    const messages = [...state.messages];
    const lastIndex = messages.findLastIndex((m) => m.role === 'assistant');
    if (lastIndex !== -1) {
      messages[lastIndex] = { ...messages[lastIndex], text };
    }
    return { messages };
  }),

  clear: () => set({ messages: [] }),
}));