import { Tool } from '@/types/session';

// AdvancedTab Component - VAD settings, audio config, tools

import { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { wsService } from '@/services/wsService';
import { ChevronDown, ChevronRight, Globe, Search, FileText, Server, Code } from 'lucide-react';

const SAMPLE_RATES = [8000, 16000, 22050, 24000, 32000, 44100, 48000];

export function AdvancedTab() {
  const { config, setConfig, status } = useSessionStore();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    vad: true,
    audio: false,
    tools: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateConfig = (updates: Partial<typeof config>) => {
    setConfig(updates);
    if (wsService.isConnected()) {
      wsService.sendSessionUpdate({ ...config, ...updates });
    }
  };

  const updateTurnDetection = (updates: Partial<typeof config.turn_detection>) => {
    setConfig({
      turn_detection: { ...config.turn_detection, ...updates },
    });
    if (wsService.isConnected()) {
      wsService.sendSessionUpdate({
        ...config,
        turn_detection: { ...config.turn_detection, ...updates },
      });
    }
  };

  const toggleTool = (toolType: string) => {
    const existingTool = config.tools.find((t) => t.type === toolType);
    if (existingTool) {
      setConfig({
        tools: config.tools.filter((t) => t.type !== toolType),
      });
    } else {
      // Add tool with default config
      const newTool = getDefaultTool(toolType);
      setConfig({ tools: [...config.tools, newTool] });
    }
    if (wsService.isConnected()) {
      setTimeout(() => wsService.sendSessionUpdate(config), 100);
    }
  };

  const isToolEnabled = (toolType: string) => {
    return config.tools.some((t) => t.type === toolType);
  };

  const sendUpdate = () => {
    if (wsService.isConnected()) {
      wsService.sendSessionUpdate(config);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* VAD Settings */}
      <Section
        title="Voice Activity Detection (VAD)"
        expanded={expandedSections.vad}
        onToggle={() => toggleSection('vad')}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs text-xai-text-muted flex justify-between mb-1">
              <span>Threshold</span>
              <span>{config.turn_detection.threshold}</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={config.turn_detection.threshold}
              onChange={(e) => updateTurnDetection({ threshold: parseFloat(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-xai-text-muted mt-1">
              Higher = less sensitive to speech
            </p>
          </div>

          <div>
            <label className="text-xs text-xai-text-muted flex justify-between mb-1">
              <span>Silence Duration (ms)</span>
              <span>{config.turn_detection.silence_duration_ms}</span>
            </label>
            <input
              type="range"
              min="0"
              max="10000"
              step="100"
              value={config.turn_detection.silence_duration_ms}
              onChange={(e) => updateTurnDetection({ silence_duration_ms: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs text-xai-text-muted flex justify-between mb-1">
              <span>Prefix Padding (ms)</span>
              <span>{config.turn_detection.prefix_padding_ms}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={config.turn_detection.prefix_padding_ms}
              onChange={(e) => updateTurnDetection({ prefix_padding_ms: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </Section>

      {/* Audio Settings */}
      <Section
        title="Audio Settings"
        expanded={expandedSections.audio}
        onToggle={() => toggleSection('audio')}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs text-xai-text-muted mb-1 block">Input Sample Rate</label>
            <select
              value={config.audio.input.format.rate}
              onChange={(e) => updateConfig({
                audio: {
                  ...config.audio,
                  input: { format: { type: 'audio/pcm', rate: parseInt(e.target.value) as any } },
                },
              })}
              className="w-full bg-xai-dark border border-xai-border rounded-lg px-3 py-2 text-xai-text"
            >
              {SAMPLE_RATES.map((rate) => (
                <option key={rate} value={rate}>{rate} Hz</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-xai-text-muted mb-1 block">Output Sample Rate</label>
            <select
              value={config.audio.output.format.rate}
              onChange={(e) => updateConfig({
                audio: {
                  ...config.audio,
                  output: { format: { type: 'audio/pcm', rate: parseInt(e.target.value) as any } },
                },
              })}
              className="w-full bg-xai-dark border border-xai-border rounded-lg px-3 py-2 text-xai-text"
            >
              {SAMPLE_RATES.map((rate) => (
                <option key={rate} value={rate}>{rate} Hz</option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* Tools */}
      <Section
        title="Tools"
        expanded={expandedSections.tools}
        onToggle={() => toggleSection('tools')}
      >
        <div className="space-y-3 pt-2">
          <ToolToggle
            icon={<Globe className="w-4 h-4" />}
            name="web_search"
            enabled={isToolEnabled('web_search')}
            onToggle={() => toggleTool('web_search')}
          />
          <ToolToggle
            icon={<Search className="w-4 h-4" />}
            name="x_search"
            enabled={isToolEnabled('x_search')}
            onToggle={() => toggleTool('x_search')}
          />
          <ToolToggle
            icon={<FileText className="w-4 h-4" />}
            name="file_search"
            enabled={isToolEnabled('file_search')}
            onToggle={() => toggleTool('file_search')}
          />
          <ToolToggle
            icon={<Server className="w-4 h-4" />}
            name="mcp"
            enabled={isToolEnabled('mcp')}
            onToggle={() => toggleTool('mcp')}
          />
          <ToolToggle
            icon={<Code className="w-4 h-4" />}
            name="function"
            enabled={isToolEnabled('function')}
            onToggle={() => toggleTool('function')}
          />
        </div>
      </Section>

      {status === 'CONNECTED' && (
        <div className="text-xs text-xai-text-muted flex items-center gap-2 pt-4">
          <div className="w-2 h-2 bg-xai-success rounded-full" />
          Settings are applied in real-time
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, expanded, onToggle, children }: SectionProps) {
  return (
    <div className="border border-xai-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-xai-dark/50 hover:bg-xai-dark transition-colors"
      >
        <span className="font-medium text-sm">{title}</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-xai-text-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-xai-text-muted" />
        )}
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

interface ToolToggleProps {
  icon: React.ReactNode;
  name: string;
  enabled: boolean;
  onToggle: () => void;
}

function ToolToggle({ icon, name, enabled, onToggle }: ToolToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
        enabled
          ? 'border-xai-accent bg-xai-accent/10'
          : 'border-xai-border hover:border-xai-text-muted'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={enabled ? 'text-xai-accent' : 'text-xai-text-muted'}>{icon}</span>
        <span className="text-sm">{name}</span>
      </div>
      <div
        className={`w-10 h-6 rounded-full transition-colors relative ${
          enabled ? 'bg-xai-accent' : 'bg-xai-border'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </div>
    </button>
  );
}

function getDefaultTool(type: string): Tool {
  switch (type) {
    case 'web_search':
      return { type: 'web_search', allowed_domains: [] } as Tool;
    case 'x_search':
      return { type: 'x_search', allowed_x_handles: [] } as Tool;
    case 'file_search':
      return { type: 'file_search', vector_store_ids: [] } as Tool;
    case 'mcp':
      return { type: 'mcp', server_url: '', server_label: '' } as Tool;
    case 'function':
      return { type: 'function', name: '', description: '', parameters: {} } as Tool;
    default:
      return { type: 'web_search' } as Tool;
  }
}
