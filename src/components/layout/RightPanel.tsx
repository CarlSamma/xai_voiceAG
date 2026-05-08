// RightPanel Component - Settings

import { useUiStore } from '@/stores/uiStore';
import { SettingsPanel } from '@/components/settings/SettingsPanel';

export function RightPanel() {
  const { activeSettingsTab, setActiveSettingsTab } = useUiStore();

  return (
    <aside className="w-96 border-l border-xai-border bg-xai-darker flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-xai-border">
        <TabButton
          active={activeSettingsTab === 'basic'}
          onClick={() => setActiveSettingsTab('basic')}
        >
          Basic
        </TabButton>
        <TabButton
          active={activeSettingsTab === 'advanced'}
          onClick={() => setActiveSettingsTab('advanced')}
        >
          Advanced
        </TabButton>
        <TabButton
          active={activeSettingsTab === 'developer'}
          onClick={() => setActiveSettingsTab('developer')}
        >
          Developer
        </TabButton>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        <SettingsPanel activeTab={activeSettingsTab} />
      </div>
    </aside>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'text-xai-accent border-b-2 border-xai-accent bg-xai-dark/50'
          : 'text-xai-text-muted hover:text-xai-text hover:bg-xai-border/50'
      }`}
    >
      {children}
    </button>
  );
}