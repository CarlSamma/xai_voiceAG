// BasicTab Component - Basic settings (voice, instructions, language)

import { useSessionStore } from '@/stores/sessionStore';
import { useState, useEffect, useRef } from 'react';
import { wsService } from '@/services/wsService';

const VOICES = [
  { id: 'eve', name: 'Eve' },
  { id: 'ara', name: 'Ara' },
  { id: 'rex', name: 'Rex' },
  { id: 'sal', name: 'Sal' },
  { id: 'leo', name: 'Leo' },
];

const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect' },
  { code: 'en', name: 'English' },
  { code: 'it', name: 'Italian' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'hi', name: 'Hindi' },
];

export function BasicTab() {
  const { config, setConfig, status } = useSessionStore();
  const [localInstructions, setLocalInstructions] = useState(config.instructions);
  const [selectedVoice, setSelectedVoice] = useState(config.voice);
  const [customVoice, setCustomVoice] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync local state with store
  useEffect(() => {
    setLocalInstructions(config.instructions);
    setSelectedVoice(config.voice);
  }, [config.instructions, config.voice]);

  // Debounced update to send session.update
  const sendUpdate = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (wsService.isConnected()) {
        const voice = customVoice || selectedVoice;
        wsService.sendSessionUpdate({ ...config, voice });
      }
    }, 500);
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'custom') {
      setCustomVoice('');
    } else {
      setSelectedVoice(value);
      setConfig({ voice: value });
      sendUpdate();
    }
  };

  const handleCustomVoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomVoice(value);
    setConfig({ voice: value });
    sendUpdate();
  };

  const handleInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalInstructions(value);
    setConfig({ instructions: value });
    sendUpdate();
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLanguage(value);
    // Language is used as a hint, appended to instructions
    sendUpdate();
  };

  return (
    <div className="p-4 space-y-6">
      {/* Voice Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-xai-text">Voice</label>
        <select
          value={selectedVoice}
          onChange={handleVoiceChange}
          className="w-full bg-xai-dark border border-xai-border rounded-lg px-3 py-2 text-xai-text focus:outline-none focus:border-xai-accent"
        >
          {VOICES.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name}
            </option>
          ))}
          <option value="custom">Custom...</option>
        </select>

        {selectedVoice === 'custom' && (
          <input
            type="text"
            value={customVoice}
            onChange={handleCustomVoiceChange}
            placeholder="Enter custom voice ID"
            className="w-full bg-xai-dark border border-xai-border rounded-lg px-3 py-2 text-xai-text placeholder:text-xai-text-muted focus:outline-none focus:border-xai-accent"
          />
        )}
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-xai-text">
          Instructions
          <span className="text-xai-text-muted text-xs ml-2">(System Prompt)</span>
        </label>
        <textarea
          value={localInstructions}
          onChange={handleInstructionsChange}
          rows={6}
          placeholder="You are a helpful assistant..."
          className="w-full bg-xai-dark border border-xai-border rounded-lg px-3 py-2 text-xai-text placeholder:text-xai-text-muted focus:outline-none focus:border-xai-accent resize-none"
        />
      </div>

      {/* Language Hint */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-xai-text">Language Hint</label>
        <select
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className="w-full bg-xai-dark border border-xai-border rounded-lg px-3 py-2 text-xai-text focus:outline-none focus:border-xai-accent"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Status indicator */}
      {status === 'CONNECTED' && (
        <div className="text-xs text-xai-text-muted flex items-center gap-2">
          <div className="w-2 h-2 bg-xai-success rounded-full" />
          Settings are applied in real-time
        </div>
      )}
    </div>
  );
}