// Sidebar Component - Navigation

import { useSessionStore } from '@/stores/sessionStore';
import { Settings, MessageSquare, Info, Key, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';

export function Sidebar() {
  const { apiKey, setApiKey } = useSessionStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <aside
      className={`bg-xai-darker border-r border-xai-border flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 bg-xai-dark border border-xai-border rounded-full p-1 hover:bg-xai-border transition-colors z-10"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* API Key Section */}
      <div className="p-4 border-b border-xai-border">
        {!sidebarCollapsed && (
          <label className="flex items-center gap-2 text-xai-text-muted text-sm mb-2">
            <Key className="w-4 h-4" />
            API Key
          </label>
        )}
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={sidebarCollapsed ? '🔑' : 'Enter your xAI API key'}
          className={`w-full bg-xai-dark border border-xai-border rounded-lg px-3 py-2 text-sm text-xai-text placeholder:text-xai-text-muted focus:outline-none focus:border-xai-accent ${
            sidebarCollapsed ? 'h-10' : ''
          }`}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <NavItem icon={<MessageSquare />} label="Session" collapsed={sidebarCollapsed} />
        <NavItem icon={<Settings />} label="Settings" collapsed={sidebarCollapsed} />
        <NavItem icon={<Info />} label="About" collapsed={sidebarCollapsed} />
      </nav>

      {/* Connection Status */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-xai-border">
          <div className="text-xs text-xai-text-muted">
            <p>xAI Grok Voice Agent</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      )}
    </aside>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active?: boolean;
}

function NavItem({ icon, label, collapsed, active = false }: NavItemProps) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-xai-accent/20 text-xai-accent'
          : 'text-xai-text-muted hover:bg-xai-border hover:text-xai-text'
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  );
}