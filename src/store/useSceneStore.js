import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from '../utils/nanoid.js';

const defaultScene = {
  name: 'Новая сцена',
  mapUrl: '/maps/default.jpg',
  fitMode: 'contain',
  mapScale: 1,
  pan: { x: 0, y: 0 },
  zoom: 1,
  grid: {
    enabled: true,
    size: 64,
    color: '#3b3b42',
    opacity: 0.6
  },
  fog: {
    enabled: false,
    opacity: 0.5
  },
  units: {
    label: 'ft',
    unitsPerGrid: 5
  },
  tokens: [],
  notesMarkdown: '### Добро пожаловать в MythCrit!\n\nДобавляйте заметки здесь.\n'
};

export const useSceneStore = create(
  persist(
    (set, get) => ({
      scene: defaultScene,
      setScene: (scene) => set({ scene: { ...defaultScene, ...scene } }),
      updateScene: (partial) => set({ scene: { ...get().scene, ...partial } }),
      setMap: (mapUrl) => set({ scene: { ...get().scene, mapUrl } }),
      setPanZoom: ({ pan, zoom }) =>
        set({ scene: { ...get().scene, pan: pan ?? get().scene.pan, zoom: zoom ?? get().scene.zoom } }),
      toggleGrid: () =>
        set(({ scene }) => ({ scene: { ...scene, grid: { ...scene.grid, enabled: !scene.grid.enabled } } })),
      toggleFog: () =>
        set(({ scene }) => ({ scene: { ...scene, fog: { ...scene.fog, enabled: !scene.fog.enabled } } })),
      setUnitsPerGrid: (value) =>
        set(({ scene }) => ({ scene: { ...scene, units: { ...scene.units, unitsPerGrid: value } } })),
      addToken: (token) => {
        const id = nanoid();
        set(({ scene }) => ({ scene: { ...scene, tokens: [...scene.tokens, { id, ...token }] } }));
        return id;
      },
      updateToken: (id, updates) =>
        set(({ scene }) => ({
          scene: {
            ...scene,
            tokens: scene.tokens.map((token) => (token.id === id ? { ...token, ...updates } : token))
          }
        })),
      removeToken: (id) =>
        set(({ scene }) => ({ scene: { ...scene, tokens: scene.tokens.filter((token) => token.id !== id) } })),
      importScene: (sceneJson) => {
        try {
          const parsed = typeof sceneJson === 'string' ? JSON.parse(sceneJson) : sceneJson;
          set({ scene: { ...defaultScene, ...parsed } });
        } catch (err) {
          console.error('Failed to import scene', err);
        }
      },
      exportScene: () => {
        const data = JSON.stringify(get().scene, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${get().scene.name || 'scene'}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      },
      setNotes: (notesMarkdown) =>
        set(({ scene }) => ({ scene: { ...scene, notesMarkdown } })),
      resetScene: () => set({ scene: defaultScene })
    }),
    {
      name: 'mythcrit-scene'
    }
  )
);
