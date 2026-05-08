// SettingsPanel Component - Container for settings tabs

import { BasicTab } from './tabs/BasicTab';
import { AdvancedTab } from './tabs/AdvancedTab';
import { DeveloperTab } from './tabs/DeveloperTab';

interface SettingsPanelProps {
  activeTab: 'basic' | 'advanced' | 'developer';
}

export function SettingsPanel({ activeTab }: SettingsPanelProps) {
  switch (activeTab) {
    case 'basic':
      return <BasicTab />;
    case 'advanced':
      return <AdvancedTab />;
    case 'developer':
      return <DeveloperTab />;
    default:
      return <BasicTab />;
  }
}