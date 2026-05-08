// xAI Voice Agent Types

export type AudioFormat = {
  type: 'audio/pcm' | 'audio/pcmu' | 'audio/pcma';
  rate?: 8000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000;
};

export type TurnDetection = {
  type: 'server_vad' | null;
  threshold?: number;
  silence_duration_ms?: number;
  prefix_padding_ms?: number;
};

export type WebSearchTool = {
  type: 'web_search';
  allowed_domains?: string[];
};

export type XSearchTool = {
  type: 'x_search';
  allowed_x_handles?: string[];
};

export type FileSearchTool = {
  type: 'file_search';
  vector_store_ids: string[];
  max_num_results?: number;
};

export type McpTool = {
  type: 'mcp';
  server_url: string;
  server_label: string;
  server_description?: string;
  allowed_tools?: string[];
  authorization?: string;
  headers?: Record<string, string>;
};

export type FunctionTool = {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type Tool = WebSearchTool | XSearchTool | FileSearchTool | McpTool | FunctionTool;

export type SessionConfig = {
  voice: string;
  instructions: string;
  turn_detection: TurnDetection;
  audio: {
    input: { format: AudioFormat };
    output: { format: AudioFormat };
  };
  tools: Tool[];
};

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  voice: 'eve',
  instructions: 'You are a helpful assistant.',
  turn_detection: {
    type: 'server_vad',
    threshold: 0.85,
    silence_duration_ms: 500,
    prefix_padding_ms: 333,
  },
  audio: {
    input: { format: { type: 'audio/pcm', rate: 24000 } },
    output: { format: { type: 'audio/pcm', rate: 24000 } },
  },
  tools: [],
};

export type SessionStatus = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'RESETTING' | 'ERROR';

export type LogCategory = 'audio' | 'function' | 'session' | 'error' | 'status';

export type LogEntry = {
  id: string;
  ts: number;
  direction: 'in' | 'out';
  type: string;
  summary: string;
  raw: object;
  category: LogCategory;
};

export type TranscriptMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
};