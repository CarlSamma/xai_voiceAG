// DeveloperTab Component - JSON editor for raw session config

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { wsService } from '@/services/wsService';
import Editor from '@monaco-editor/react';

export function DeveloperTab() {
  const { config, applyJsonConfig, status } = useSessionStore();
  const [jsonContent, setJsonContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastSentConfig, setLastSentConfig] = useState<string | null>(null);
  const [diff, setDiff] = useState<string | null>(null);

  // Sync JSON content with config
  useEffect(() => {
    const formatted = JSON.stringify(config, null, 2);
    setJsonContent(formatted);
  }, [config]);

  // Update diff when config changes
  useEffect(() => {
    if (lastSentConfig) {
      const currentConfig = JSON.stringify(config, null, 2);
      if (currentConfig !== lastSentConfig) {
        setDiff(currentConfig);
      } else {
        setDiff(null);
      }
    }
  }, [config, lastSentConfig]);

  const handleEditorChange = (value: string | undefined) => {
    setJsonContent(value || '');
    
    // Validate JSON
    try {
      JSON.parse(value || '');
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleApply = () => {
    if (error) {
      alert('Cannot apply invalid JSON');
      return;
    }

    try {
      const parsed = JSON.parse(jsonContent);
      applyJsonConfig(jsonContent);
      
      // Send session update
      if (wsService.isConnected()) {
        wsService.sendSessionUpdate(parsed);
        setLastSentConfig(JSON.stringify(parsed, null, 2));
        setDiff(null);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      setJsonContent(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="px-4 py-3 border-b border-xai-border flex items-center justify-between">
        <span className="text-sm font-medium">Session Configuration (JSON)</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFormat}
            className="text-xs text-xai-text-muted hover:text-xai-text px-2 py-1 rounded hover:bg-xai-border"
          >
            Format
          </button>
          <button
            onClick={handleApply}
            disabled={!!error || status !== 'CONNECTED'}
            className="text-xs bg-xai-accent hover:bg-xai-accent-hover text-white px-3 py-1 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply JSON
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-xai-error/10 text-xai-error text-xs border-b border-xai-error/20">
          JSON Error: {error}
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={jsonContent}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Diff Viewer */}
      {diff && (
        <div className="border-t border-xai-border p-4 bg-xai-darker">
          <div className="text-xs text-xai-text-muted mb-2">Unsaved changes</div>
          <pre className="text-xs text-xai-text bg-xai-dark p-2 rounded overflow-auto max-h-32">
            {diff}
          </pre>
        </div>
      )}

      {/* Status */}
      {status === 'CONNECTED' && (
        <div className="px-4 py-2 border-t border-xai-border text-xs text-xai-text-muted flex items-center gap-2">
          <div className="w-2 h-2 bg-xai-success rounded-full" />
          Connected — changes will be sent to the server
        </div>
      )}
    </div>
  );
}