// CenterPanel Component - Transcript View

import { useTranscriptStore } from '@/stores/transcriptStore';
import { TranscriptMessage } from '@/components/transcript/TranscriptMessage';

export function CenterPanel() {
  const { messages } = useTranscriptStore();

  return (
    <main className="flex-1 flex flex-col bg-xai-dark overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-xai-border">
        <h2 className="text-lg font-semibold text-xai-text">Conversation Transcript</h2>
        <p className="text-sm text-xai-text-muted mt-1">
          Real-time transcription of the voice conversation
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-xai-text-muted">
            <div className="w-16 h-16 bg-xai-border rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <p className="text-center">
              No conversation yet.<br />
              Connect to start a voice session.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <TranscriptMessage key={message.id} message={message} />
          ))
        )}
      </div>
    </main>
  );
}