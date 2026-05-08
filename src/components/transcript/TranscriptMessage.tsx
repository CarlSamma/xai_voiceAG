// TranscriptMessage Component - Single transcript message

import type { TranscriptMessage as TranscriptMessageType } from '@/types/session';
import { User, Bot } from 'lucide-react';

interface TranscriptMessageProps {
  message: TranscriptMessageType;
}

export function TranscriptMessage({ message }: TranscriptMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-xai-accent' : 'bg-xai-border'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-xai-text" />
        )}
      </div>

      {/* Content */}
      <div
        className={`flex flex-col gap-1 max-w-[70%] ${
          isUser ? 'items-end' : ''
        }`}
      >
        {/* Label */}
        <span className="text-xs text-xai-text-muted">
          {isUser ? 'You' : 'Grok'}
        </span>

        {/* Message bubble */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-xai-accent text-white rounded-tr-sm'
              : 'bg-xai-border text-xai-text rounded-tl-sm'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.text || '...'}</p>
        </div>

        {/* Timestamp */}
        <span className="text-xs text-xai-text-muted">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}