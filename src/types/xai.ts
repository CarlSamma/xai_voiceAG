// xAI WebSocket Event Types

// Client -> Server Events
export interface SessionUpdateEvent {
  type: 'session.update';
  session: {
    voice?: string;
    instructions?: string;
    turn_detection?: {
      type: 'server_vad' | null;
      threshold?: number;
      silence_duration_ms?: number;
      prefix_padding_ms?: number;
    };
    audio?: {
      input?: { format: { type: string; rate?: number } };
      output?: { format: { type: string; rate?: number } };
    };
    tools?: Array<{
      type: string;
      [key: string]: unknown;
    }>;
  };
}

export interface InputAudioBufferAppendEvent {
  type: 'input_audio_buffer.append';
  audio: string; // base64 PCM16
}

export interface InputAudioBufferCommitEvent {
  type: 'input_audio_buffer.commit';
}

export interface InputAudioBufferClearEvent {
  type: 'input_audio_buffer.clear';
}

export interface ConversationItemCreateEvent {
  type: 'conversation.item.create';
  item: {
    id?: string;
    type: 'message' | 'function_call' | 'function_call_output';
    role?: 'user' | 'assistant' | 'system';
    content?: Array<{ type: string; text?: string }>;
    call_id?: string;
    output?: string;
    name?: string;
    arguments?: string;
  };
}

export interface ResponseCreateEvent {
  type: 'response.create';
}

export interface ResponseCancelEvent {
  type: 'response.cancel';
}

export type ClientEvent =
  | SessionUpdateEvent
  | InputAudioBufferAppendEvent
  | InputAudioBufferCommitEvent
  | InputAudioBufferClearEvent
  | ConversationItemCreateEvent
  | ResponseCreateEvent
  | ResponseCancelEvent;

// Server -> Client Events
export interface SessionCreatedEvent {
  type: 'session.created';
  session: Record<string, unknown>;
}

export interface ConversationCreatedEvent {
  type: 'conversation.created';
}

export interface SessionUpdatedEvent {
  type: 'session.updated';
  session: Record<string, unknown>;
}

export interface InputAudioBufferSpeechStartedEvent {
  type: 'input_audio_buffer.speech_started';
}

export interface InputAudioBufferSpeechStoppedEvent {
  type: 'input_audio_buffer.speech_stopped';
}

export interface InputAudioBufferCommittedEvent {
  type: 'input_audio_buffer.committed';
}

export interface InputAudioBufferClearedEvent {
  type: 'input_audio_buffer.cleared';
}

export interface ConversationItemAddedEvent {
  type: 'conversation.item.added';
  item: {
    id: string;
    type: 'message' | 'function_call' | 'function_call_output';
    role?: 'user' | 'assistant';
    content?: Array<{ type: string; text?: string }>;
    call_id?: string;
    output?: string;
  };
}

export interface ConversationItemDeletedEvent {
  type: 'conversation.item.deleted';
  id: string;
}

export interface InputAudioTranscriptionCompletedEvent {
  type: 'conversation.item.input_audio_transcription.completed';
  id: string;
  transcription: string;
}

export interface ResponseCreatedEvent {
  type: 'response.created';
  response: { id: string };
}

export interface ResponseOutputItemAddedEvent {
  type: 'response.output_item.added';
  response: { id: string };
  output_item: { id: string; type: string };
}

export interface ResponseOutputItemDoneEvent {
  type: 'response.output_item.done';
  response: { id: string };
  output_item: { id: string; type: string };
}

export interface ResponseContentPartAddedEvent {
  type: 'response.content_part.added';
  response: { id: string };
  output_item: { id: string };
  content_part: { type: string };
}

export interface ResponseContentPartDoneEvent {
  type: 'response.content_part.done';
  response: { id: string };
  output_item: { id: string };
  content_part: { type: string };
}

export interface ResponseOutputAudioTranscriptDeltaEvent {
  type: 'response.output_audio_transcript.delta';
  response: { id: string };
  transcript: string;
}

export interface ResponseOutputAudioTranscriptDoneEvent {
  type: 'response.output_audio_transcript.done';
  response: { id: string };
  transcript: string;
}

export interface ResponseOutputAudioDeltaEvent {
  type: 'response.output_audio.delta';
  response: { id: string };
  audio: string; // base64 PCM16
}

export interface ResponseOutputAudioDoneEvent {
  type: 'response.output_audio.done';
  response: { id: string };
}

export interface ResponseTextDeltaEvent {
  type: 'response.text.delta';
  response: { id: string };
  delta: string;
}

export interface ResponseFunctionCallArgumentsDeltaEvent {
  type: 'response.function_call_arguments.delta';
  response: { id: string };
  call_id: string;
  delta: string;
}

export interface ResponseFunctionCallArgumentsDoneEvent {
  type: 'response.function_call_arguments.done';
  response: { id: string };
  call_id: string;
  name: string;
  arguments: string;
}

export interface ResponseMcpCallArgumentsDeltaEvent {
  type: 'response.mcp_call_arguments.delta';
  response: { id: string };
  call_id: string;
  delta: string;
}

export interface ResponseMcpCallArgumentsDoneEvent {
  type: 'response.mcp_call_arguments.done';
  response: { id: string };
  call_id: string;
  name: string;
  arguments: string;
}

export interface ResponseMcpCallInProgressEvent {
  type: 'response.mcp_call.in_progress';
  response: { id: string };
  call_id: string;
}

export interface ResponseMcpCallCompletedEvent {
  type: 'response.mcp_call.completed';
  response: { id: string };
  call_id: string;
  output: string;
}

export interface ResponseMcpCallFailedEvent {
  type: 'response.mcp_call.failed';
  response: { id: string };
  call_id: string;
  error: string;
}

export interface McpListToolsInProgressEvent {
  type: 'mcp_list_tools.in_progress';
}

export interface McpListToolsCompletedEvent {
  type: 'mcp_list_tools.completed';
  tools: Array<{ name: string; description?: string }>;
}

export interface McpListToolsFailedEvent {
  type: 'mcp_list_tools.failed';
  error: string;
}

export interface ResponseDoneEvent {
  type: 'response.done';
  response: { id: string };
}

export interface ErrorEvent {
  type: 'error';
  error: {
    code: string;
    message: string;
  };
}

export type ServerEvent =
  | SessionCreatedEvent
  | ConversationCreatedEvent
  | SessionUpdatedEvent
  | InputAudioBufferSpeechStartedEvent
  | InputAudioBufferSpeechStoppedEvent
  | InputAudioBufferCommittedEvent
  | InputAudioBufferClearedEvent
  | ConversationItemAddedEvent
  | ConversationItemDeletedEvent
  | InputAudioTranscriptionCompletedEvent
  | ResponseCreatedEvent
  | ResponseOutputItemAddedEvent
  | ResponseOutputItemDoneEvent
  | ResponseContentPartAddedEvent
  | ResponseContentPartDoneEvent
  | ResponseOutputAudioTranscriptDeltaEvent
  | ResponseOutputAudioTranscriptDoneEvent
  | ResponseOutputAudioDeltaEvent
  | ResponseOutputAudioDoneEvent
  | ResponseTextDeltaEvent
  | ResponseFunctionCallArgumentsDeltaEvent
  | ResponseFunctionCallArgumentsDoneEvent
  | ResponseMcpCallArgumentsDeltaEvent
  | ResponseMcpCallArgumentsDoneEvent
  | ResponseMcpCallInProgressEvent
  | ResponseMcpCallCompletedEvent
  | ResponseMcpCallFailedEvent
  | McpListToolsInProgressEvent
  | McpListToolsCompletedEvent
  | McpListToolsFailedEvent
  | ResponseDoneEvent
  | ErrorEvent;

export type XaiEvent = ServerEvent | { type: string; [key: string]: unknown };