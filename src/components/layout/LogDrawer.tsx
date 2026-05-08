// LogDrawer Component - Event Log

import { useState } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { useLogStore } from '@/stores/logStore';
import { ChevronUp, ChevronDown, Trash2, Copy, FileJson } from 'lucide-react';
import type { LogCategory } from '@/types/session';

export function LogDrawer() {
  const { logDrawerOpen, toggleLogDrawer, logViewMode, setLogViewMode } = useUiStore();
  const { entries, clear } = useLogStore();
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    const json = entries.map((e) => JSON.stringify(e)).join('\n');
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryColor = (category: LogCategory) => {
    switch (category) {
      case 'audio':
        return 'text-blue-400';
      case 'function':
        return 'text-orange-400';
      case 'session':
        return 'text-teal-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getDirectionIcon = (direction: 'in' | 'out') => {
    return direction === 'in' ? '↓' : '↑';
  };

  return (
    <div
      className={`bg-xai-darker border-t border-xai-border transition-all duration-300 ${
        logDrawerOpen ? 'h-64' : 'h-12'
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-xai-border cursor-pointer"
        onClick={toggleLogDrawer}
      >
        <div className="flex items-center gap-2">
          <FileJson className="w-4 h-4 text-xai-text-muted" />
          <span className="font-medium text-sm">Event Log</span>
          <span className="text-xs text-xai-text-muted bg-xai-border px-2 py-0.5 rounded">
            {entries.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLogViewMode(logViewMode === 'human' ? 'raw' : 'human');
            }}
            className="text-xs text-xai-text-muted hover:text-xai-text px-2 py-1 rounded hover:bg-xai-border"
          >
            {logViewMode === 'human' ? 'Raw JSON' : 'Human Readable'}
          </button>

          {/* Copy All */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyAll();
            }}
            className="text-xs text-xai-text-muted hover:text-xai-text px-2 py-1 rounded hover:bg-xai-border flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            {copied ? 'Copied!' : 'Copy All'}
          </button>

          {/* Clear */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            className="text-xs text-xai-text-muted hover:text-xai-error px-2 py-1 rounded hover:bg-xai-border flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>

          {/* Expand/Collapse */}
          <button className="text-xai-text-muted hover:text-xai-text">
            {logDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Log Entries */}
      {logDrawerOpen && (
        <div className="h-48 overflow-y-auto p-2 space-y-1">
          {entries.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xai-text-muted text-sm">
              No events logged yet
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-2 px-3 py-2 rounded bg-xai-dark/50 hover:bg-xai-dark text-xs font-mono"
              >
                {/* Direction */}
                <span
                  className={`font-bold ${
                    entry.direction === 'in' ? 'text-xai-success' : 'text-xai-warning'
                  }`}
                >
                  {getDirectionIcon(entry.direction)}
                </span>

                {/* Timestamp */}
                <span className="text-xai-text-muted">
                  {new Date(entry.ts).toLocaleTimeString()}
                </span>

                {/* Type */}
                <span className={`font-semibold ${getCategoryColor(entry.category)}`}>
                  {entry.type}
                </span>

                {/* Summary */}
                <span className="text-xai-text flex-1 truncate">
                  {logViewMode === 'raw' ? JSON.stringify(entry.raw) : entry.summary}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}