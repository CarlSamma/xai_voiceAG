// UI Store - Manages UI state (tabs, drawer, theme)

import { create } from 'zustand';

type SettingsTab = 'basic' | 'advanced' | 'developer';
type LogViewMode = 'human' | 'raw';

interface UiState {
  activeSettingsTab: SettingsTab;
  logDrawerOpen: boolean;
  logViewMode: LogViewMode;
  sidebarCollapsed: boolean;
  
  // Actions
  setActiveSettingsTab: (tab: SettingsTab) => void;
  setLogDrawerOpen: (open: boolean) => void;
  setLogViewMode: (mode: LogViewMode) => void;
  toggleLogDrawer: () => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeSettingsTab: 'basic',
  logDrawerOpen: false,
  logViewMode: 'human',
  sidebarCollapsed: false,

  setActiveSettingsTab: (tab) => set({ activeSettingsTab: tab }),
  setLogDrawerOpen: (open) => set({ logDrawerOpen: open }),
  setLogViewMode: (mode) => set({ logViewMode: mode }),
  toggleLogDrawer: () => set((state) => ({ logDrawerOpen: !state.logDrawerOpen })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));