import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_STATE = {
  mode: 'desktop',
  activeTab: 'map',
  showTokenInspector: false,
  selectedTokenId: null,
  showSettings: false,
  showHelp: false,
  rulerActive: false
};

export const useUIStore = create(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setMode: (mode) => set({ mode }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      openTokenInspector: (tokenId) => set({ showTokenInspector: true, selectedTokenId: tokenId }),
      closeTokenInspector: () => set({ showTokenInspector: false, selectedTokenId: null }),
      toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
      setSettingsOpen: (value) => set({ showSettings: value }),
      toggleHelp: () => set((state) => ({ showHelp: !state.showHelp })),
      setRulerActive: (active) => set({ rulerActive: active }),
      resetUI: () => set({ ...DEFAULT_STATE })
    }),
    {
      name: 'mythcrit-ui'
    }
  )
);
