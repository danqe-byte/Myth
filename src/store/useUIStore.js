import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_STATE = {
  mode: 'desktop',
  activeTab: 'map',
  showTokenInspector: false,
  selectedTokenId: null,
  showSettings: false,
  showHelp: false,
  rulerActive: false,
  showMapTransformHandles: false,
  tokenSnapToGrid: false,
  sidebarOpen: true,
  gridCalibration: {
    active: false,
    points: [],
    cells: null
  }
};

export const useUIStore = create(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      setMode: (mode) => set({ mode }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      openTokenInspector: (tokenId) => set({ showTokenInspector: true, selectedTokenId: tokenId }),
      closeTokenInspector: () => set({ showTokenInspector: false, selectedTokenId: null }),
      setSelectedToken: (tokenId) => set({ selectedTokenId: tokenId }),
      toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
      setSettingsOpen: (value) => set({ showSettings: value }),
      toggleHelp: () => set((state) => ({ showHelp: !state.showHelp })),
      setRulerActive: (active) => set({ rulerActive: active }),
      setShowMapTransformHandles: (value) =>
        set({ showMapTransformHandles: typeof value === 'boolean' ? value : !get().showMapTransformHandles }),
      setTokenSnapToGrid: (value) => set({ tokenSnapToGrid: Boolean(value) }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (value) => set({ sidebarOpen: Boolean(value) }),
      beginGridCalibration: () =>
        set({
          gridCalibration: {
            active: true,
            points: [],
            cells: null
          }
        }),
      addGridCalibrationPoint: (point) =>
        set((state) => {
          if (!state.gridCalibration.active) return {};
          const points = [...state.gridCalibration.points, point].slice(0, 2);
          return {
            gridCalibration: {
              ...state.gridCalibration,
              points
            }
          };
        }),
      setGridCalibrationCells: (cells) =>
        set((state) => ({
          gridCalibration: {
            ...state.gridCalibration,
            cells
          }
        })),
      cancelGridCalibration: () => set({ gridCalibration: { ...DEFAULT_STATE.gridCalibration } }),
      completeGridCalibration: () => set({ gridCalibration: { ...DEFAULT_STATE.gridCalibration } }),
      resetUI: () => set({ ...DEFAULT_STATE })
    }),
    {
      name: 'mythcrit-ui',
      version: 2,
      migrate: (persisted, version) => {
        if (!persisted) return { ...DEFAULT_STATE };
        if (version < 1) {
          return { ...DEFAULT_STATE, ...persisted };
        }
        return { ...DEFAULT_STATE, ...persisted };
      }
    }
  )
);
